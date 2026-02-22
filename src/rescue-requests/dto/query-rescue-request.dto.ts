import { IsNotEmpty, IsNumber, IsOptional, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class QueryRescueRequestDto {
    @ApiProperty({
        description: 'Vĩ độ (Latitude) - VD: 21.028511 (Hà Nội)',
        example: 21.028511,
        required: true,
        type: Number,
    })
    @IsNotEmpty()
    @Type(() => Number) // Chuyển đổi chuỗi từ URL sang số
    @IsNumber()
    @Min(-90)
    @Max(90)
    latitude: number;

    @ApiProperty({
        description: 'Kinh độ (Longitude) - VD: 105.854444',
        example: 105.854444,
        required: true,
        type: Number,
    })
    @IsNotEmpty()
    @Type(() => Number)
    @IsNumber()
    @Min(-180)
    @Max(180)
    longitude: number;

    @ApiPropertyOptional({
        description: 'Bán kính tìm kiếm (mét)',
        example: 5000,
        default: 3000,
        type: Number,
    })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    radius?: number;
}