import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as crypto from 'crypto';
import * as qs from 'qs';

import { Donation, DonationDocument } from './schemas/donation.schema';
import { DonationStatus } from './enums/donation-status.enum';
import { GetDonationsDto } from './dto/get-donations.dto';

@Injectable()
export class DonationsService {
    private readonly logger = new Logger(DonationsService.name);

    constructor(
        private configService: ConfigService,
        @InjectModel(Donation.name) private donationModel: Model<DonationDocument>,
    ) { }

    // =========================================================================
    // PRIVATE HELPERS
    // =========================================================================

    private getConfig(key: string): string {
        const value = this.configService.get<string>(key);
        if (!value) throw new Error(`Missing env: ${key}`);
        return value.replace(/['"]/g, '').trim();
    }

    private sortObject(obj: Record<string, any>): Record<string, string> {
        const sorted: Record<string, string> = {};
        const keys = Object.keys(obj).map(encodeURIComponent).sort();

        for (const key of keys) {
            const val = obj[decodeURIComponent(key)];
            sorted[key] = encodeURIComponent(val?.toString() || '').replace(/%20/g, '+');
        }

        return sorted;
    }

    private createSignature(params: Record<string, any>): string {
        const secretKey = this.getConfig('VNP_HASH_SECRET');
        const sorted = this.sortObject(params);
        const signData = qs.stringify(sorted, { encode: false });
        return crypto
            .createHmac('sha512', secretKey)
            .update(Buffer.from(signData, 'utf-8'))
            .digest('hex');
    }

    private verifySignature(query: Record<string, any>): { isValid: boolean; params: Record<string, any> } {
        const params: Record<string, string> = {};

        for (const key in query) {
            if (key.startsWith('vnp_')) {
                params[key] = query[key];
            }
        }

        const secureHash = params['vnp_SecureHash'];

        delete params['vnp_SecureHash'];
        delete params['vnp_SecureHashType'];

        const signed = this.createSignature(params);
        const isValid = !!secureHash && secureHash.toString().toLowerCase() === signed.toLowerCase();

        return { isValid, params };
    }

    private generateOrderId(): string {
        const now = new Date();
        const pad = (n: number) => n.toString().padStart(2, '0');

        const yy = now.getFullYear().toString().slice(-2);
        const MM = pad(now.getMonth() + 1);
        const dd = pad(now.getDate());
        const HH = pad(now.getHours());
        const mm = pad(now.getMinutes());
        const ss = pad(now.getSeconds());

        const rand = crypto.randomBytes(2).toString('hex').toUpperCase();

        return `DONATE_${yy}${MM}${dd}${HH}${mm}${ss}_${rand}`;
    }

    private getVnpayDate(): string {
        const now = new Date();
        const vnTime = new Date(now.getTime() + 7 * 60 * 60 * 1000);
        const y = vnTime.getUTCFullYear();
        const M = (vnTime.getUTCMonth() + 1).toString().padStart(2, '0');
        const d = vnTime.getUTCDate().toString().padStart(2, '0');
        const H = vnTime.getUTCHours().toString().padStart(2, '0');
        const m = vnTime.getUTCMinutes().toString().padStart(2, '0');
        const s = vnTime.getUTCSeconds().toString().padStart(2, '0');
        return `${y}${M}${d}${H}${m}${s}`;
    }

    // =========================================================================
    // 1. TẠO LINK THANH TOÁN (Đã dọn dẹp param username)
    // =========================================================================
    async createVNPayUrl(userId: string, ipAddr: string, amount: number, message?: string) {
        const tmnCode = this.getConfig('VNP_TMN_CODE');
        const vnpUrl = this.getConfig('VNP_URL');
        const returnUrl = this.getConfig('VNP_RETURN_URL');

        const orderId = this.generateOrderId();
        const createDate = this.getVnpayDate();
        const orderInfo = message || 'Quyen gop cuu ho';

        // Chỉ lưu userId (chuẩn ObjectId), không lưu username rác vào DB
        await this.donationModel.create({
            userId,
            orderId,
            amount,
            message: orderInfo,
            status: DonationStatus.PENDING,
        });

        const vnpParams: Record<string, any> = {
            vnp_Version: '2.1.0',
            vnp_Command: 'pay',
            vnp_TmnCode: tmnCode,
            vnp_Locale: 'vn',
            vnp_CurrCode: 'VND',
            vnp_TxnRef: orderId,
            vnp_OrderInfo: orderInfo,
            vnp_OrderType: 'other',
            vnp_Amount: amount * 100,
            vnp_ReturnUrl: returnUrl,
            vnp_IpAddr: ipAddr,
            vnp_CreateDate: createDate,
        };

        const signed = this.createSignature(vnpParams);
        const sortedParams = this.sortObject(vnpParams);
        sortedParams['vnp_SecureHash'] = signed;

        const paymentUrl = vnpUrl + '?' + qs.stringify(sortedParams, { encode: false });

        this.logger.log(`Created payment: ${orderId} | User ID: ${userId} | ${amount}đ`);
        return { paymentUrl, orderId };
    }

    // =========================================================================
    // 2. XỬ LÝ RETURN URL
    // =========================================================================
    verifyReturnUrl(query: Record<string, any>) {
        const { isValid, params } = this.verifySignature(query);

        if (!isValid) {
            return { isSuccess: false, message: 'Chữ ký không hợp lệ' };
        }

        if (params['vnp_ResponseCode'] === '00') {
            return { isSuccess: true, message: 'Thanh toán thành công' };
        }

        return { isSuccess: false, message: 'Giao dịch thất bại / Bị hủy' };
    }

    // =========================================================================
    // 3. XỬ LÝ IPN WEBHOOK
    // =========================================================================
    async processIpn(query: Record<string, any>) {
        const { isValid, params } = this.verifySignature(query);

        if (!isValid) {
            this.logger.warn(`IPN checksum failed: ${query['vnp_TxnRef']}`);
            return { RspCode: '97', Message: 'Checksum failed' };
        }

        const orderId = params['vnp_TxnRef'];
        const rspCode = params['vnp_ResponseCode'];
        const amount = params['vnp_Amount'];

        const order = await this.donationModel.findOne({ orderId });
        if (!order) {
            this.logger.warn(`IPN order not found: ${orderId}`);
            return { RspCode: '01', Message: 'Order not found' };
        }

        if (order.amount * 100 !== Number(amount)) {
            this.logger.warn(`IPN amount mismatch: ${orderId}`);
            return { RspCode: '04', Message: 'Invalid amount' };
        }

        if (order.status !== DonationStatus.PENDING) {
            return { RspCode: '02', Message: 'Order already confirmed' };
        }

        if (rspCode === '00') {
            await this.donationModel.updateOne(
                { orderId },
                {
                    status: DonationStatus.SUCCESS,
                    vnp_TransactionNo: params['vnp_TransactionNo'],
                },
            );
            this.logger.log(`IPN success: ${orderId}`);
        } else {
            await this.donationModel.updateOne(
                { orderId },
                { status: DonationStatus.FAILED },
            );
            this.logger.warn(`IPN failed: ${orderId} | code=${rspCode}`);
        }

        return { RspCode: '00', Message: 'Confirm Success' };
    }

    // =========================================================================
    // 4. LẤY DANH SÁCH DONATIONS (Cho Admin)
    // =========================================================================
    async findAll(dto: GetDonationsDto) {
        const { page = 1, limit = 10, status } = dto;
        const skip = (page - 1) * limit;

        const filter: Record<string, any> = {};
        if (status) filter.status = status;

        const [data, total] = await Promise.all([
            this.donationModel
                .find(filter)
                .populate('userId', 'username fullName') // 🔥 Móc data User vào đây
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .select('-__v')
                .lean(),
            this.donationModel.countDocuments(filter),
        ]);

        return {
            data,
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
        };
    }

    // =========================================================================
    // 5. LẤY CHI TIẾT 1 DONATION
    // =========================================================================
    async findOne(orderId: string) {
        const donation = await this.donationModel
            .findOne({ orderId })
            .populate('userId', 'username fullName') // 🔥 Móc data User vào đây
            .select('-__v')
            .lean();

        if (!donation) {
            throw new NotFoundException(`Không tìm thấy donation: ${orderId}`);
        }

        return donation;
    }

    // =========================================================================
    // 6. LẤY LỊCH SỬ CỦA TỪNG NGƯỜI DÙNG
    // =========================================================================
    async findHistoryByUser(userId: string, dto: GetDonationsDto) {
        const { page = 1, limit = 10, status } = dto;
        const skip = (page - 1) * limit;

        const filter: Record<string, any> = { userId };
        if (status) filter.status = status;

        const [data, total] = await Promise.all([
            this.donationModel
                .find(filter)
                .populate('userId', 'username fullName') // 🔥 Móc data User vào đây
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .select('-__v')
                .lean(),
            this.donationModel.countDocuments(filter),
        ]);

        return {
            data,
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
        };
    }
}