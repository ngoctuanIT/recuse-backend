import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CancelRescueRequestDto {
    @ApiProperty({ example: 'Nước đã rút, tôi an toàn rồi', description: 'Lý do hủy yêu cầu' })
    @IsNotEmpty({ message: 'Vui lòng cung cấp lý do hủy' })
    @IsString()
    @MaxLength(255)
    cancelReason: string;
}