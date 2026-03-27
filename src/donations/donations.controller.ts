import { Controller, Post, Get, Body, Req, Query, Res, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { DonationsService } from './donations.service';
import { CreateDonationDto } from './dto/create-donation.dto';

@Controller('donations')
export class DonationsController {
    constructor(private readonly donationsService: DonationsService) { }

    @Post('vnpay-create')
    async createPayment(@Body() body: CreateDonationDto, @Req() req: Request) {
        // 1. Lấy IP của Client
        let ipAddr = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';

        // 2. Ép kiểu về chuỗi nếu x-forwarded-for trả về mảng (Fix lỗi Proxy)
        if (Array.isArray(ipAddr)) {
            ipAddr = ipAddr[0];
        }

        // 3. 🛡️ CHỐT CHẶN: Ép IPv6 localhost về IPv4 để VNPay không bị lỗi chữ ký
        if (ipAddr === '::1' || ipAddr === '::ffff:127.0.0.1') {
            ipAddr = '127.0.0.1';
        }

        return this.donationsService.createVNPayUrl(
            ipAddr as string,
            body.amount,
            body.message || 'Quyen gop cuu ho' // Nhớ test bằng tiếng Việt không dấu nhé
        );
    }

    @Get('vnpay-return')
    vnpayReturn(@Query() query: any, @Res() res: Response) {
        const result = this.donationsService.verifyReturnUrl(query);

        if (result.isSuccess) {
            return res.status(HttpStatus.OK).json({ message: '🎉 GIAO DỊCH THÀNH CÔNG', details: result });
        } else {
            return res.status(HttpStatus.BAD_REQUEST).json({ message: '❌ GIAO DỊCH THẤT BẠI', details: result });
        }
    }

    @Get('vnpay-ipn')
    async vnpayIpn(@Query() query: any) {
        const result = await this.donationsService.processIpn(query);
        return result;
    }
}