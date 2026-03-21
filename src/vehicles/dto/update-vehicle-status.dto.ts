import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { VehicleStatus } from '../enums/vehicle.enum'; // 👈 Import từ file dùng chung

export class UpdateVehicleStatusDto {
    @ApiProperty({ enum: VehicleStatus, example: VehicleStatus.MAINTENANCE, description: 'Tình trạng phương tiện' })
    @IsNotEmpty()
    @IsEnum(VehicleStatus, { message: 'Trạng thái không hợp lệ (AVAILABLE, IN_USE, MAINTENANCE, BROKEN)' })
    status: VehicleStatus; // Đổi type string thành kiểu Enum
}