import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';

// Định nghĩa sẵn các trạng thái hợp lệ để Swagger tạo dropdown
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
    status: string;
}