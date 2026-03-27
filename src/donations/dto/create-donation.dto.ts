import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class CreateDonationDto {
    @ApiProperty({ example: 50000, description: 'Số tiền quyên góp (Tối thiểu 10.000đ)' })
    @IsNotEmpty()
    @IsNumber()
    @Min(10000, { message: 'VNPay không hỗ trợ giao dịch dưới 10.000đ' })
    amount: number;

    @ApiPropertyOptional({ example: 'Ung ho dong bao vung lu', description: 'Lời nhắn quyên góp' })
    @IsString()
    message?: string;
}