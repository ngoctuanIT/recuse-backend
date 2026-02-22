import { Controller, Get, Post, Body, Patch, Param, UseGuards, ValidationPipe, UsePipes } from '@nestjs/common';
import { InventoriesService } from './inventories.service';
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { UpdateStockDto } from './dto/update-stock.dto';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Role } from '../auth/enums/role.enum';

@ApiTags('Inventories (Quản lý Kho Hàng)')
@ApiBearerAuth()
@Controller('inventories')
export class InventoriesController {
    constructor(private readonly inventoriesService: InventoriesService) { }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.MANAGER, Role.ADMIN) // Chỉ thủ kho mới được tạo mặt hàng mới
    @Post()
    @UsePipes(new ValidationPipe())
    @ApiOperation({ summary: '[Manager] Thêm mặt hàng mới vào kho' })
    create(@Body() createInventoryDto: CreateInventoryDto) {
        return this.inventoriesService.create(createInventoryDto);
    }

    @UseGuards(AuthGuard('jwt'))
    @Get()
    @ApiOperation({ summary: 'Xem danh sách tất cả vật phẩm trong kho' })
    findAll() {
        return this.inventoriesService.findAll();
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.MANAGER, Role.ADMIN, Role.COORDINATOR) // Coordinator cũng có thể xuất kho để đưa cho Đội cứu hộ
    @Patch(':id/stock')
    @UsePipes(new ValidationPipe())
    @ApiOperation({ summary: '[Manager/Coordinator] Nhập/Xuất kho (Truyền số âm để xuất)' })
    updateStock(@Param('id') id: string, @Body() updateStockDto: UpdateStockDto) {
        return this.inventoriesService.updateStock(id, updateStockDto.amount);
    }
}