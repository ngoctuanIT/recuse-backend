import { IsNotEmpty, IsString, MinLength, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'; // 1. Import cái này

// 2. Định nghĩa danh sách Role để Swagger hiện Dropdown chọn (đỡ phải gõ tay)
export enum UserRole {
    CITIZEN = 'CITIZEN',
    RESCUE_TEAM = 'RESCUE_TEAM',
    COORDINATOR = 'COORDINATOR',
    MANAGER = 'MANAGER',
    ADMIN = 'ADMIN',
}

export class CreateUserDto {
    // --- USERNAME ---
    @ApiProperty({
        example: 'nguyenvana',
        description: 'Tên đăng nhập (Duy nhất)',
    })
    @IsNotEmpty()
    @IsString()
    username: string;

    // --- PASSWORD ---
    @ApiProperty({
        example: '123456',
        description: 'Mật khẩu (Tối thiểu 6 ký tự)',
        minLength: 6
    })
    @IsNotEmpty()
    @MinLength(6, { message: 'Mật khẩu phải dài hơn 6 ký tự' })
    password: string;

    // --- FULL NAME ---
    @ApiProperty({
        example: 'Nguyễn Văn A',
        description: 'Họ và tên đầy đủ'
    })
    @IsNotEmpty()
    @IsString()
    fullName: string;

    // --- PHONE ---
    @ApiProperty({
        example: '0987654321',
        description: 'Số điện thoại liên lạc'
    })
    @IsNotEmpty()
    @IsString()
    phone: string;

    // --- ROLE (Quan trọng: Chọn từ danh sách) ---
    @ApiPropertyOptional({
        enum: UserRole, // Hiện Dropdown 
        default: UserRole.CITIZEN, // Mặc định là dân thường
        description: 'Vai trò người dùng (Mặc định là CITIZEN)'
    })
    @IsOptional()
    @IsEnum(UserRole, { message: 'Role không hợp lệ (Phải là CITIZEN, ADMIN...)' })
    role?: string;
}