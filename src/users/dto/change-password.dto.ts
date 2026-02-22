import { IsNotEmpty, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
    @ApiProperty({ example: '123456', description: 'Mật khẩu cũ' })
    @IsNotEmpty()
    oldPassword: string;

    @ApiProperty({ example: 'newPass123', description: 'Mật khẩu mới (tối thiểu 6 ký tự)' })
    @IsNotEmpty()
    @MinLength(6)
    newPassword: string;
}