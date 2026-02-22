import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsEnum, IsNumber, Min } from 'class-validator';

export enum VehicleType {
  BOAT = 'BOAT',
  CAR = 'CAR',
  HELICOPTER = 'HELICOPTER',
  TRUCK = 'TRUCK',
  OTHER = 'OTHER'
}

export class CreateVehicleDto {
  @ApiProperty({ example: '51C-12345', description: 'Biển số hoặc Mã phương tiện' })
  @IsNotEmpty()
  @IsString()
  plateNumber: string;

  @ApiProperty({ enum: VehicleType, example: VehicleType.BOAT, description: 'Loại phương tiện' })
  @IsNotEmpty()
  @IsEnum(VehicleType)
  type: string;

  @ApiProperty({ example: 12, description: 'Sức chứa tối đa (người hoặc tấn hàng)' })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  capacity: number;
}