import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsArray, IsOptional, IsEnum } from 'class-validator';

// Định nghĩa sẵn các trạng thái hoạt động của đội
export enum TeamStatus {
    AVAILABLE = 'AVAILABLE',
    BUSY = 'BUSY',
    OFFLINE = 'OFFLINE'
}

export class CreateRescueTeamDto {
    @ApiProperty({ example: 'Đội Phản Ứng Nhanh Quận 1', description: 'Tên đội cứu hộ' })
    @IsNotEmpty()
    @IsString()
    teamName: string;

    @ApiProperty({ example: '65f1a2b3... (ID của User)', description: 'ID của Đội trưởng' })
    @IsNotEmpty()
    @IsString()
    leaderId: string;

    @ApiPropertyOptional({ type: [String], description: 'Danh sách ID các thành viên đi cùng', example: [] })
    @IsOptional()
    @IsArray()
    members?: string[];

    @ApiPropertyOptional({ type: [String], description: 'Danh sách ID phương tiện cấp cho đội', example: [] })
    @IsOptional()
    @IsArray()
    vehicles?: string[];
}