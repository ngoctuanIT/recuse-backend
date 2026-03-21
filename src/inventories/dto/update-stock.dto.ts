import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, NotEquals } from 'class-validator';

export class UpdateStockDto {
    @ApiProperty({ 
        example: -50, 
        description: 'Số lượng thay đổi: Dương (+) là Nhập kho, Âm (-) là Xuất kho' 
    })
    @IsNotEmpty()
    @IsNumber()
    @NotEquals(0, { message: 'Số lượng thay đổi không được bằng 0' })
    quantityChange: number;
}