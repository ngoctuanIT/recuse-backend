import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsMongoId, IsNotEmpty, IsOptional, IsArray, ValidateNested, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

// 1. DTO phụ: Định nghĩa cấu trúc của 1 món vật tư mang theo
export class SupplyItemDto {
  @ApiProperty({ example: '65f1a2b3c4d5e6f7a8b9c0d1', description: 'ID của vật tư trong Kho (Inventories)' })
  @IsMongoId({ message: 'ID vật tư không đúng định dạng MongoDB' })
  @IsNotEmpty({ message: 'ID vật tư không được để trống' })
  inventoryId: string;

  @ApiProperty({ example: 50, description: 'Số lượng mang theo' })
  @IsNumber({}, { message: 'Số lượng phải là một con số' })
  @Min(1, { message: 'Số lượng mang theo ít nhất phải là 1' })
  quantity: number;
}

// 2. DTO chính: Khuôn dữ liệu cho luồng Phân công (Assign)
export class AssignRequestDto {
  @ApiProperty({ example: '65f1a2b3c4d5e6f7a8b9c0a1', description: 'ID của Đội cứu hộ được giao việc' })
  @IsMongoId({ message: 'ID Đội cứu hộ không đúng định dạng' })
  @IsNotEmpty({ message: 'Bắt buộc phải chọn Đội cứu hộ' })
  teamId: string;

  @ApiPropertyOptional({ example: '65f1a2b3c4d5e6f7a8b9c0b2', description: 'ID của Phương tiện (Xe/Xuồng)' })
  @IsMongoId({ message: 'ID Phương tiện không đúng định dạng' })
  @IsOptional()
  vehicleId?: string;

  @ApiPropertyOptional({ type: [SupplyItemDto], description: 'Danh sách vật tư mang theo' })
  @IsArray({ message: 'Danh sách vật tư phải là một mảng' })
  @IsOptional()
  @ValidateNested({ each: true }) // Báo cho NestJS biết phải kiểm tra từng phần tử bên trong mảng
  @Type(() => SupplyItemDto)      // Chuyển đổi dữ liệu JSON thành class SupplyItemDto để validate
  supplies?: SupplyItemDto[];
}