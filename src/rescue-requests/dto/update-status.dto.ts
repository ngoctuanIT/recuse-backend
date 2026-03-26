import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString, ValidateIf, IsOptional } from 'class-validator';

export enum RequestStatus {
    PENDING = 'PENDING',
    VERIFIED = 'VERIFIED',
    IN_PROGRESS = 'IN_PROGRESS',
    COMPLETED = 'COMPLETED',
    CANCELLED = 'CANCELLED'
}

export class UpdateStatusDto {
    @ApiProperty({
        enum: RequestStatus,
        example: RequestStatus.IN_PROGRESS,
        description: 'Trạng thái mới của yêu cầu cứu hộ'
    })
    @IsNotEmpty()
    @IsEnum(RequestStatus, { message: 'Trạng thái không hợp lệ' })
    status: RequestStatus; // Nên dùng kiểu Enum luôn thay vì string

    // 👇 THÊM TRƯỜNG ẢNH CHỨNG THỰC
    @ApiPropertyOptional({
        example: 'https://res.cloudinary.com/.../image.jpg',
        description: 'Link ảnh chứng thực (BẮT BUỘC khi status là COMPLETED)'
    })
    @ValidateIf(o => o.status === RequestStatus.COMPLETED) // 🛡️ Điều kiện: Chỉ validate khi status == COMPLETED
    @IsNotEmpty({ message: 'Bắt buộc phải cung cấp ảnh chứng thực khi hoàn thành nhiệm vụ!' })
    @IsString()
    evidenceImage?: string;

    // (Tùy chọn) Thêm lý do hủy nếu status là CANCELLED
    @ApiPropertyOptional({ example: 'Đã có đội khác đến cứu', description: 'Lý do hủy' })
    @ValidateIf(o => o.status === RequestStatus.CANCELLED)
    @IsNotEmpty({ message: 'Vui lòng nhập lý do hủy yêu cầu!' })
    @IsString()
    cancelReason?: string;
}