import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsEnum, IsNumber, Min } from 'class-validator';
import { VehicleType } from '../enums/vehicle.enum'; // 👈 Import từ file dùng chung

export class CreateVehicleDto {
  // Bổ sung trường name thân thiện với người dùng
  @ApiProperty({ example: 'Xuồng máy cứu hộ 500W', description: 'Tên phương tiện' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: '51C-12345', description: 'Biển số hoặc Mã phương tiện' })
  @IsNotEmpty()
  @IsString()
  plateNumber: string;

  @ApiProperty({ enum: VehicleType, example: VehicleType.BOAT, description: 'Loại phương tiện' })
  @IsNotEmpty()
  @IsEnum(VehicleType)
  type: VehicleType; // Đổi type string thành kiểu Enum cho TypeScript check lỗi tốt hơn

  @ApiProperty({ example: 12, description: 'Sức chứa tối đa (người hoặc tấn hàng)' })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  capacity: number;
}