import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class UpdateStockDto {
    @ApiProperty({
        example: 50,
        description: 'Số lượng thay đổi (Số dương để nhập thêm, Số âm để xuất kho)'
    })
    @IsNotEmpty()
    @IsNumber()
    amount: number; // Ví dụ: 50 (Nhập 50 thùng), -20 (Xuất 20 thùng)
}