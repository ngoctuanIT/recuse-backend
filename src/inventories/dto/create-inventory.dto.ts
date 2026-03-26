import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsNumber, Min, IsOptional, IsEnum, IsDate, MinDate } from 'class-validator';
import { Type } from 'class-transformer'; // 👈 Import thêm cái này để ép kiểu
import { InventoryCategory } from '../enums/inventory.enum';

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

    // 👇 Trả description về đúng nghĩa vụ của nó (Ghi chú tự do)
    @ApiPropertyOptional({ example: 'Bảo quản nơi khô ráo, để cách mặt đất', description: 'Ghi chú thêm về vật phẩm' })
    @IsOptional()
    @IsString()
    description?: string;

    // 👇 THÊM TRƯỜNG HẠN SỬ DỤNG CHUẨN CHỈNH (Dành cho Thực phẩm/Thuốc men)
    @ApiPropertyOptional({
        example: '2026-12-31T00:00:00.000Z',
        description: 'Hạn sử dụng của vật phẩm (Định dạng ISO 8601)'
    })
    @IsOptional()
    @Type(() => Date) // Ép chuỗi string từ Frontend thành Object Date của NodeJS
    @IsDate({ message: 'Hạn sử dụng phải là định dạng ngày tháng hợp lệ' })
    @MinDate(new Date(), { message: 'Hạn sử dụng không được nằm trong quá khứ!' }) // 🛡️ Chặn đồ đã hết hạn từ vòng gửi xe
    expirationDate?: Date;
}