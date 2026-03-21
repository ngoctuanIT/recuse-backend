import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsMongoId, IsOptional } from 'class-validator';

export class CreateRescueTeamDto {
    @ApiProperty({ example: 'Đội Phản Ứng Nhanh Quận 1', description: 'Tên đội cứu hộ' })
    @IsNotEmpty({ message: 'Tên đội không được để trống' })
    @IsString()
    teamName: string;

    @ApiProperty({ example: '65f1a2b3c4d5e6f7a8b9c0d1', description: 'ID của Đội trưởng' })
    @IsNotEmpty()
    @IsMongoId({ message: 'leaderId phải là định dạng ObjectId của MongoDB' })
    leaderId: string;

    // THÊM TRƯỜNG NÀY: Vô cùng quan trọng để hệ thống biết đội này đóng quân ở đâu
    @ApiPropertyOptional({ example: 'Quận 1, TP.HCM', description: 'Khu vực hoạt động/Trạm đóng quân' })
    @IsOptional()
    @IsString()
    baseArea?: string;

    // ĐÃ XÓA members, vehicles và TeamStatus
}