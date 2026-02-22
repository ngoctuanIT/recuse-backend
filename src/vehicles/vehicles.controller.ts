import { Controller, Get, Post, Body, Patch, Param, UseGuards, ValidationPipe, UsePipes } from '@nestjs/common';
import { VehiclesService } from './vehicles.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleStatusDto } from './dto/update-vehicle-status.dto';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';

import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Role } from '../auth/enums/role.enum';

@ApiTags('Vehicles (Quản lý kho xe)')
@ApiBearerAuth()
@Controller('vehicles')
export class VehiclesController {
    constructor(private readonly vehiclesService: VehiclesService) { }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.MANAGER, Role.ADMIN) // 👈 MANAGER thêm xe mới
    @Post()
    @UsePipes(new ValidationPipe())
    @ApiOperation({ summary: '[Manager] Thêm phương tiện mới vào kho' })
    create(@Body() createVehicleDto: CreateVehicleDto) {
        return this.vehiclesService.create(createVehicleDto);
    }

    @UseGuards(AuthGuard('jwt'))
    @Get()
    @ApiOperation({ summary: 'Xem toàn bộ phương tiện (Ai đăng nhập cũng xem được)' })
    findAll() {
        return this.vehiclesService.findAll();
    }

    @UseGuards(AuthGuard('jwt'))
    @Get('available')
    @ApiOperation({ summary: '[Coordinator] Lấy danh sách xe đang rảnh để điều phối' })
    findAvailable() {
        return this.vehiclesService.findAvailable();
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.MANAGER, Role.ADMIN) // 👈 MANAGER báo xe hỏng/bảo trì
    @Patch(':id/status')
    @UsePipes(new ValidationPipe())
    @ApiOperation({ summary: '[Manager] Cập nhật tình trạng xe (Hỏng, Bảo trì...)' })
    updateStatus(@Param('id') id: string, @Body() updateStatusDto: UpdateVehicleStatusDto) {
        return this.vehiclesService.updateStatus(id, updateStatusDto);
    }
}