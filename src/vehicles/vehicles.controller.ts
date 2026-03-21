import {
    Controller, Get, Post, Body, Patch, Param, Delete, // 👈 Import thêm Delete
    UseGuards, ValidationPipe, UsePipes
} from '@nestjs/common';
import { VehiclesService } from './vehicles.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto'; // 👈 Import thêm DTO này
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
    @Roles(Role.MANAGER, Role.ADMIN)
    @Post()
    @UsePipes(new ValidationPipe({ whitelist: true })) // Nên bật whitelist để lọc rác
    @ApiOperation({ summary: '[Manager/Admin] Thêm phương tiện mới vào kho' })
    create(@Body() createVehicleDto: CreateVehicleDto) {
        return this.vehiclesService.create(createVehicleDto);
    }

    @UseGuards(AuthGuard('jwt'))
    @Get()
    @ApiOperation({ summary: 'Xem toàn bộ phương tiện (Trừ xe đã thanh lý)' })
    findAll() {
        return this.vehiclesService.findAll();
    }

    // 🛡️ BẮT BUỘC: /available phải nằm TRƯỚC /:id để không bị dính bẫy Routing
    @UseGuards(AuthGuard('jwt'))
    @Get('available')
    @ApiOperation({ summary: '[Coordinator] Lấy danh sách xe đang rảnh để điều phối' })
    findAvailable() {
        return this.vehiclesService.findAvailable();
    }

    // 👇 1. MỚI: Xem chi tiết 1 xe
    @UseGuards(AuthGuard('jwt'))
    @Get(':id')
    @ApiOperation({ summary: 'Xem chi tiết 1 phương tiện' })
    findOne(@Param('id') id: string) {
        return this.vehiclesService.findOne(id);
    }

    // 👇 2. MỚI: Sửa thông tin cơ bản của xe
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.MANAGER, Role.ADMIN)
    @Patch(':id')
    @UsePipes(new ValidationPipe({ whitelist: true }))
    @ApiOperation({ summary: '[Manager/Admin] Cập nhật thông tin xe (Tên, Biển số, Sức chứa)' })
    update(
        @Param('id') id: string,
        @Body() updateVehicleDto: UpdateVehicleDto
    ) {
        return this.vehiclesService.update(id, updateVehicleDto);
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.MANAGER, Role.ADMIN, Role.COORDINATOR) // Coordinator nên có quyền báo xe hỏng
    @Patch(':id/status')
    @UsePipes(new ValidationPipe({ whitelist: true }))
    @ApiOperation({ summary: '[Manager/Coordinator] Cập nhật tình trạng xe (Hỏng, Bảo trì...)' })
    updateStatus(@Param('id') id: string, @Body() updateStatusDto: UpdateVehicleStatusDto) {
        return this.vehiclesService.updateStatus(id, updateStatusDto);
    }

    // 👇 3. MỚI: Thanh lý xe
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.MANAGER, Role.ADMIN)
    @Delete(':id')
    @ApiOperation({ summary: '[Manager/Admin] Thanh lý/Xóa mềm phương tiện hỏng' })
    remove(@Param('id') id: string) {
        return this.vehiclesService.remove(id);
    }
}