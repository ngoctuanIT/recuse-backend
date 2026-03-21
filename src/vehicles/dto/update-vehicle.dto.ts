import { PartialType } from '@nestjs/swagger';
import { CreateVehicleDto } from './create-vehicle.dto';

// Kế thừa toàn bộ CreateVehicleDto nhưng biến các trường thành Optional (Không bắt buộc)
export class UpdateVehicleDto extends PartialType(CreateVehicleDto) { }