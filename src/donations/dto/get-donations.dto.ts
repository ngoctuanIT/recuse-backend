import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { DonationStatus } from '../enums/donation-status.enum';

export class GetDonationsDto {
    @ApiPropertyOptional({ example: 1, description: 'Trang hiện tại', default: 1 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number = 1;

    @ApiPropertyOptional({ example: 10, description: 'Số item mỗi trang', default: 10 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    limit?: number = 10;

    @ApiPropertyOptional({ enum: DonationStatus, description: 'Lọc theo trạng thái' })
    @IsOptional()
    @IsEnum(DonationStatus)
    status?: DonationStatus;
}