import {
    Controller, Post, Get,
    Body, Req, Query, Res,
    Param, HttpStatus, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { AuthGuard } from '@nestjs/passport'; // Sử dụng đúng Passport JWT

import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';

import { DonationsService } from './donations.service';
import { CreateDonationDto } from './dto/create-donation.dto';
import { GetDonationsDto } from './dto/get-donations.dto';

@ApiTags('Donations (Quản lý Quyên góp)')
@Controller('donations')
export class DonationsController {
    constructor(private readonly donationsService: DonationsService) { }

    // =========================================================================
    // 1. TẠO LINK THANH TOÁN (Chỉ Citizen/User mới quyên góp)
    // =========================================================================
    @ApiBearerAuth()
    @UseGuards(AuthGuard('jwt')) // Chỉ cần check đăng nhập là được quyên góp
    @Post('vnpay-create')
    @ApiOperation({ summary: 'Tạo link thanh toán VNPAY (Yêu cầu đăng nhập)' })
    async createPayment(@Body() body: CreateDonationDto, @Req() req: any) {
        let ipAddr = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
        if (Array.isArray(ipAddr)) ipAddr = ipAddr[0];
        if (ipAddr === '::1' || ipAddr === '::ffff:127.0.0.1') ipAddr = '127.0.0.1';

        // ĐÃ FIX: Lấy userId từ req.user.sub (Khớp với cấu hình trả về trong JwtStrategy)
        const userId = req.user?.sub;

        return this.donationsService.createVNPayUrl(
            userId,
            ipAddr as string,
            body.amount,
            body.message,
        );
    }

    // =========================================================================
    // 2. LẤY LỊCH SỬ QUYÊN GÓP CỦA TÔI
    // =========================================================================
    @ApiBearerAuth()
    @UseGuards(AuthGuard('jwt'))
    @Get('my-history')
    @ApiOperation({ summary: 'Xem lịch sử quyên góp cá nhân' })
    async getMyHistory(@Req() req: any, @Query() query: GetDonationsDto) {

        // ĐÃ FIX: Lấy userId từ req.user.sub
        const userId = req.user?.sub;

        return this.donationsService.findHistoryByUser(userId, query);
    }

    // =========================================================================
    // 3. VNPAY RETURN URL (Public - FE gọi để hiển thị kết quả)
    // =========================================================================
    @Get('vnpay-return')
    @ApiOperation({ summary: 'Hứng kết quả redirect từ VNPAY' })
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
    // 4. VNPAY IPN WEBHOOK (Public - Server VNPAY gọi ngầm)
    // =========================================================================
    @Get('vnpay-ipn')
    @ApiOperation({ summary: 'Webhook xác nhận giao dịch từ VNPAY' })
    async vnpayIpn(@Query() query: any) {
        return this.donationsService.processIpn(query);
    }

    // =========================================================================
    // 5. LẤY DANH SÁCH (Dành cho Admin/Manager quản lý dòng tiền)
    // =========================================================================
    @ApiBearerAuth()
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.MANAGER, Role.ADMIN)
    @Get()
    @ApiOperation({ summary: '[Manager/Admin] Xem toàn bộ danh sách quyên góp' })
    async findAll(@Query() query: GetDonationsDto) {
        return this.donationsService.findAll(query);
    }

    // =========================================================================
    // 6. XEM CHI TIẾT 1 ĐƠN HÀNG
    // =========================================================================
    @ApiBearerAuth()
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.MANAGER, Role.ADMIN, Role.COORDINATOR)
    @Get(':orderId')
    @ApiOperation({ summary: 'Xem chi tiết 1 đơn quyên góp' })
    async findOne(@Param('orderId') orderId: string) {
        return this.donationsService.findOne(orderId);
    }
}