import {
    Controller, Post, Get,
    Body, Req, Query, Res,
    Param, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { Request, Response } from 'express';

import { DonationsService } from './donations.service';
import { CreateDonationDto } from './dto/create-donation.dto';
import { GetDonationsDto } from './dto/get-donations.dto';


@ApiTags('Donations')
@Controller('donations')
export class DonationsController {
    constructor(private readonly donationsService: DonationsService) {}

    // =========================================================================
    // 1. TẠO LINK THANH TOÁN
    // =========================================================================
    @Post('vnpay-create')
    @ApiOperation({ summary: 'Tạo link thanh toán VNPAY' })
    @ApiResponse({ status: 201, description: 'Trả về paymentUrl và orderId' })
    async createPayment(@Body() body: CreateDonationDto, @Req() req: Request) {
        let ipAddr = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';

        if (Array.isArray(ipAddr)) ipAddr = ipAddr[0];
        if (ipAddr === '::1' || ipAddr === '::ffff:127.0.0.1') ipAddr = '127.0.0.1';

        return this.donationsService.createVNPayUrl(
            ipAddr as string,
            body.amount,
            body.message,
        );
    }

    // =========================================================================
    // 2. VNPAY RETURN URL
    // =========================================================================
    @Get('vnpay-return')
    @ApiOperation({ summary: 'VNPAY redirect về sau thanh toán' })
    vnpayReturn(@Query() query: any, @Res() res: Response) {
        const result = this.donationsService.verifyReturnUrl(query);

        if (result.isSuccess) {
            return res.status(HttpStatus.OK).json({
                message: 'GIAO DỊCH THÀNH CÔNG',
                details: result,
            });
        }

        return res.status(HttpStatus.BAD_REQUEST).json({
            message: 'GIAO DỊCH THẤT BẠI',
            details: result,
        });
    }

    // =========================================================================
    // 3. VNPAY IPN WEBHOOK
    // =========================================================================
    @Get('vnpay-ipn')
    @ApiOperation({ summary: 'VNPAY gọi ngầm để xác nhận giao dịch' })
    async vnpayIpn(@Query() query: any) {
        return this.donationsService.processIpn(query);
    }

    // =========================================================================
    // 4. LẤY DANH SÁCH DONATIONS
    // =========================================================================
    @Get()
    @ApiOperation({ summary: 'Lấy danh sách donations (pagination + filter)' })
    @ApiResponse({
        status: 200,
        description: 'Trả về danh sách donations và metadata phân trang',
    })
    async findAll(@Query() query: GetDonationsDto) {
        return this.donationsService.findAll(query);
    }

    // =========================================================================
    // 5. LẤY CHI TIẾT 1 DONATION
    // =========================================================================
    @Get(':orderId')
    @ApiOperation({ summary: 'Lấy chi tiết 1 donation theo orderId' })
    @ApiParam({ name: 'orderId', example: 'DONATE_260327200000_A3B1', description: 'Mã đơn hàng' })
    @ApiResponse({ status: 200, description: 'Trả về thông tin donation' })
    @ApiResponse({ status: 404, description: 'Không tìm thấy donation' })
    async findOne(@Param('orderId') orderId: string) {
        return this.donationsService.findOne(orderId);
    }
}