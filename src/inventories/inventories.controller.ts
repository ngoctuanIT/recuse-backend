import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, ValidationPipe } from '@nestjs/common';
import { InventoriesService } from './inventories.service';
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
import { UpdateStockDto } from './dto/update-stock.dto';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';

@ApiTags('Inventories (Quản lý Kho hàng)')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard) // Bật khiên bảo vệ toàn bộ Controller
@Controller('inventories')
export class InventoriesController {
    constructor(private readonly inventoriesService: InventoriesService) { }

    @Roles(Role.MANAGER, Role.ADMIN)
    @Post()
    @ApiOperation({ summary: '[Manager/Admin] Thêm mặt hàng mới vào kho' })
    create(@Body(new ValidationPipe({ whitelist: true })) createInventoryDto: CreateInventoryDto) {
        return this.inventoriesService.create(createInventoryDto);
    }

    @Roles(Role.MANAGER, Role.ADMIN, Role.COORDINATOR, Role.RESCUE_TEAM)
    @Get()
    @ApiOperation({ summary: 'Xem toàn bộ kho hàng (Trừ Citizen)' })
    findAll() {
        return this.inventoriesService.findAll();
    }

    @Roles(Role.MANAGER, Role.ADMIN, Role.COORDINATOR)
    @Get(':id')
    @ApiOperation({ summary: 'Xem chi tiết 1 vật phẩm' })
    findOne(@Param('id') id: string) {
        return this.inventoriesService.findOne(id);
    }

    @Roles(Role.MANAGER, Role.ADMIN)
    @Patch(':id')
    @ApiOperation({ summary: '[Manager/Admin] Sửa thông tin hàng (Tên, Đơn vị, Ngưỡng)' })
    update(
        @Param('id') id: string,
        @Body(new ValidationPipe({ whitelist: true })) updateInventoryDto: UpdateInventoryDto
    ) {
        return this.inventoriesService.update(id, updateInventoryDto);
    }

    @Roles(Role.MANAGER, Role.ADMIN, Role.COORDINATOR)
    @Patch(':id/stock')
    @ApiOperation({ summary: '[Manager/Coordinator] Nhập/Xuất kho (Âm = Xuất, Dương = Nhập)' })
    updateStock(
        @Param('id') id: string,
        @Body(new ValidationPipe({ whitelist: true })) updateStockDto: UpdateStockDto
    ) {
        return this.inventoriesService.updateStock(id, updateStockDto);
    }

    @Roles(Role.MANAGER, Role.ADMIN)
    @Delete(':id')
    @ApiOperation({ summary: '[Manager/Admin] Ngừng cung cấp/Xóa mềm vật phẩm' })
    remove(@Param('id') id: string) {
        return this.inventoriesService.remove(id);
    }
}