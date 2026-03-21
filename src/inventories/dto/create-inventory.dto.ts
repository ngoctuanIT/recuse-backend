import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsNumber, Min, IsOptional, IsEnum } from 'class-validator';
import { InventoryCategory } from '../enums/inventory.enum'; // Nhớ tạo file enum này nhé

export class CreateInventoryDto {
    @ApiProperty({ example: 'Mì tôm Hảo Hảo', description: 'Tên vật phẩm' })
    @IsNotEmpty()
    @IsString()
    itemName: string;

    @ApiProperty({ example: 'Thùng', description: 'Đơn vị tính' })
    @IsNotEmpty()
    @IsString()
    unit: string;

    @ApiProperty({ enum: InventoryCategory, example: InventoryCategory.FOOD })
    @IsNotEmpty()
    @IsEnum(InventoryCategory)
    category: InventoryCategory;

    @ApiPropertyOptional({ example: 100, description: 'Số lượng ban đầu' })
    @IsOptional()
    @IsNumber()
    @Min(0)
    quantity?: number;

    @ApiPropertyOptional({ example: 20, description: 'Ngưỡng cảnh báo sắp hết hàng' })
    @IsOptional()
    @IsNumber()
    @Min(0)
    lowStockThreshold?: number;

    @ApiPropertyOptional({ example: 'Hạn sử dụng 12/2026' })
    @IsOptional()
    @IsString()
    description?: string;
}