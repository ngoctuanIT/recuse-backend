import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsNumber, Min, IsEnum, IsOptional } from 'class-validator';

export enum ItemCategory {
    FOOD = 'FOOD',
    WATER = 'WATER',
    MEDICAL = 'MEDICAL',
    EQUIPMENT = 'EQUIPMENT',
    OTHER = 'OTHER'
}

export class CreateInventoryDto {
    @ApiProperty({ example: 'Mì tôm Hảo Hảo', description: 'Tên vật phẩm' })
    @IsNotEmpty()
    @IsString()
    itemName: string;

    @ApiProperty({ example: 500, description: 'Số lượng nhập kho ban đầu' })
    @IsNotEmpty()
    @IsNumber()
    @Min(0)
    quantity: number;

    @ApiProperty({ example: 'Thùng', description: 'Đơn vị tính' })
    @IsNotEmpty()
    @IsString()
    unit: string;

    @ApiProperty({ enum: ItemCategory, example: ItemCategory.FOOD })
    @IsOptional()
    @IsEnum(ItemCategory)
    category?: string;

    @ApiPropertyOptional({ example: 'Hạn sử dụng: 12/2026' })
    @IsOptional()
    @IsString()
    description?: string;
}