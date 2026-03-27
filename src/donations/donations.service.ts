import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as crypto from 'crypto';
import * as qs from 'qs';
import moment = require('moment');

import { Donation, DonationDocument } from './schemas/donation.schema';

@Injectable()
export class DonationsService {
    constructor(
        private configService: ConfigService,
        @InjectModel(Donation.name) private donationModel: Model<DonationDocument>
    ) { }

    // 🛡️ HÀM SORT CHUẨN ĐÃ FIX LỖI OBJECT PROTOTYPE CỦA NESTJS
    private sortObject(obj: any) {
        const sorted: Record<string, string> = {};
        const str: string[] = [];
        let key: string;
        for (key in obj) {
            // Thay vì obj.hasOwnProperty(key), dùng Object.prototype để an toàn 100%
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                str.push(encodeURIComponent(key));
            }
        }
        str.sort();
        for (let i = 0; i < str.length; i++) {
            sorted[str[i]] = encodeURIComponent(obj[str[i]].toString()).replace(/%20/g, '+');
        }
        return sorted;
    }

    // =========================================================================
    // 1. TẠO LINK THANH TOÁN (CODE CHUẨN ĐỌC TỪ .ENV)
    // =========================================================================
    async createVNPayUrl(ipAddr: string, amount: number, message: string) {
        const tmnCode = this.configService.get<string>('VNP_TMN_CODE')!.replace(/['"]/g, '').trim();
        const secretKey = this.configService.get<string>('VNP_HASH_SECRET')!.replace(/['"]/g, '').trim();
        const vnpUrl = this.configService.get<string>('VNP_URL')!.replace(/['"]/g, '').trim();
        const returnUrl = this.configService.get<string>('VNP_RETURN_URL')!.replace(/['"]/g, '').trim();

        // Ép chuẩn múi giờ Việt Nam (GMT+7)
        const createDate = moment().utcOffset('+07:00').format('YYYYMMDDHHmmss');
        const orderId = `DONATE_${moment().utcOffset('+07:00').format('DDHHmmss')}`;

        // Lưu vào DB trạng thái PENDING
        await this.donationModel.create({
            orderId,
            amount,
            message,
            status: 'PENDING'
        });

        // Build Payload chuẩn
        let vnp_Params: any = {};
        vnp_Params['vnp_Version'] = '2.1.0';
        vnp_Params['vnp_Command'] = 'pay';
        vnp_Params['vnp_TmnCode'] = tmnCode;
        vnp_Params['vnp_Locale'] = 'vn';
        vnp_Params['vnp_CurrCode'] = 'VND';
        vnp_Params['vnp_TxnRef'] = orderId;
        vnp_Params['vnp_OrderInfo'] = message; // Bỏ hardcode, dùng biến message thật
        vnp_Params['vnp_OrderType'] = 'other';
        vnp_Params['vnp_Amount'] = amount * 100;
        vnp_Params['vnp_ReturnUrl'] = returnUrl;
        vnp_Params['vnp_IpAddr'] = ipAddr;
        vnp_Params['vnp_CreateDate'] = createDate;

        // Sort và Hash
        vnp_Params = this.sortObject(vnp_Params);
        const signData = qs.stringify(vnp_Params, { encode: false });
        const hmac = crypto.createHmac('sha512', secretKey);
        const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

        vnp_Params['vnp_SecureHash'] = signed;
        const paymentUrl = vnpUrl + '?' + qs.stringify(vnp_Params, { encode: false });

        return { paymentUrl, orderId };
    }

    // =========================================================================
    // 2. XỬ LÝ RETURN URL (Chỉ hiển thị)
    // =========================================================================
    verifyReturnUrl(query: any) {
        // 🛡️ COPY OBJECT ĐỂ TRÁNH LỖI XÓA THUỘC TÍNH READ-ONLY CỦA REQUEST
        let vnp_Params = { ...query };
        const secureHash = vnp_Params['vnp_SecureHash'];

        delete vnp_Params['vnp_SecureHash'];
        delete vnp_Params['vnp_SecureHashType'];

        vnp_Params = this.sortObject(vnp_Params);
        const secretKey = this.configService.get<string>('VNP_HASH_SECRET')!.replace(/['"]/g, '').trim();
        const signData = qs.stringify(vnp_Params, { encode: false });
        const hmac = crypto.createHmac('sha512', secretKey);
        const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

        if (secureHash === signed) {
            if (vnp_Params['vnp_ResponseCode'] === '00') {
                return { isSuccess: true, message: 'Thanh toán thành công' };
            }
            return { isSuccess: false, message: 'Giao dịch thất bại / Bị hủy' };
        }
        return { isSuccess: false, message: 'Chữ ký không hợp lệ' };
    }

    // =========================================================================
    // 3. XỬ LÝ IPN WEBHOOK (Chốt đơn)
    // =========================================================================
    async processIpn(query: any) {
        // 🛡️ COPY OBJECT ĐỂ TRÁNH LỖI NHƯ TRÊN
        let vnp_Params = { ...query };
        const secureHash = vnp_Params['vnp_SecureHash'];
        const orderId = vnp_Params['vnp_TxnRef'];
        const rspCode = vnp_Params['vnp_ResponseCode'];
        const amount = vnp_Params['vnp_Amount'];

        delete vnp_Params['vnp_SecureHash'];
        delete vnp_Params['vnp_SecureHashType'];

        vnp_Params = this.sortObject(vnp_Params);
        const secretKey = this.configService.get<string>('VNP_HASH_SECRET')!.replace(/['"]/g, '').trim();
        const signData = qs.stringify(vnp_Params, { encode: false });
        const hmac = crypto.createHmac('sha512', secretKey);
        const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

        if (secureHash !== signed) {
            return { RspCode: '97', Message: 'Checksum failed' };
        }

        const order = await this.donationModel.findOne({ orderId: orderId });
        if (!order) return { RspCode: '01', Message: 'Order not found' };

        if (order.amount * 100 !== Number(amount)) {
            return { RspCode: '04', Message: 'Invalid amount' };
        }

        if (order.status !== 'PENDING') {
            return { RspCode: '02', Message: 'Order already confirmed' };
        }

        if (rspCode === '00') {
            await this.donationModel.updateOne(
                { orderId: orderId },
                { status: 'SUCCESS', vnp_TransactionNo: vnp_Params['vnp_TransactionNo'] }
            );
        } else {
            await this.donationModel.updateOne({ orderId: orderId }, { status: 'FAILED' });
        }

        return { RspCode: '00', Message: 'Confirm Success' };
    }
}