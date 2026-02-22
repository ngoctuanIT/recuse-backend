import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';

export enum VehicleStatus {
    AVAILABLE = 'AVAILABLE',
    IN_USE = 'IN_USE',
    MAINTENANCE = 'MAINTENANCE',
    BROKEN = 'BROKEN'
}

export class UpdateVehicleStatusDto {
    @ApiProperty({ enum: VehicleStatus, example: VehicleStatus.MAINTENANCE, description: 'Tình trạng phương tiện' })
    @IsNotEmpty()
    @IsEnum(VehicleStatus)
    status: string;
}