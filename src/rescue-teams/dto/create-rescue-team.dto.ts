import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsMongoId, IsOptional, IsNumber } from 'class-validator';

export class CreateRescueTeamDto {
    @ApiProperty({ example: 'Đội Phản Ứng Nhanh Quận 1', description: 'Tên đội cứu hộ' })
    @IsNotEmpty({ message: 'Tên đội không được để trống' })
    @IsString()
    teamName: string;

    @ApiProperty({ example: '65f1a2b3c4d5e6f7a8b9c0d1', description: 'ID của Đội trưởng' })
    @IsNotEmpty()
    @IsMongoId({ message: 'leaderId phải là định dạng ObjectId của MongoDB' })
    leaderId: string;

    @ApiPropertyOptional({ example: 'Quận 1, TP.HCM', description: 'Khu vực hoạt động/Trạm đóng quân' })
    @IsOptional()
    @IsString()
    baseArea?: string;

    // 👇 ĐÃ THÊM API PROPERTY CHO SWAGGER
    @ApiProperty({ example: 10.776889, description: 'Vĩ độ (Latitude) vị trí hiện tại của đội' })
    @IsNotEmpty({ message: 'Vui lòng cung cấp vĩ độ (latitude)' })
    @IsNumber({}, { message: 'Vĩ độ phải là một số' })
    latitude: number;

    @ApiProperty({ example: 106.700806, description: 'Kinh độ (Longitude) vị trí hiện tại của đội' })
    @IsNotEmpty({ message: 'Vui lòng cung cấp kinh độ (longitude)' })
    @IsNumber({}, { message: 'Kinh độ phải là một số' })
    longitude: number;
}