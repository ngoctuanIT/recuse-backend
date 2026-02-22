import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';

export enum UrgencyLevel {
  LOW = 'LOW',       // Bình thường (Cần tiếp tế thực phẩm)
  MEDIUM = 'MEDIUM', // Trung bình (Nước ngập ngang hông)
  HIGH = 'HIGH',     // Cao (Có người già, trẻ em, nước ngập sâu)
  CRITICAL = 'CRITICAL' // Khẩn cấp (Đe dọa tính mạng ngay lập tức)
}

export class VerifyRequestDto {
  @ApiProperty({ enum: UrgencyLevel, example: UrgencyLevel.HIGH, description: 'Mức độ khẩn cấp' })
  @IsNotEmpty()
  @IsEnum(UrgencyLevel)
  urgencyLevel: UrgencyLevel;
}