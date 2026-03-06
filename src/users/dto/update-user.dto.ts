import { IsString, IsOptional, Matches } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';


export class UpdateUserDto {
    @ApiPropertyOptional({ example: 'Nguyễn Văn B' })
    @IsOptional()
    @IsString()
    fullName?: string;

    @ApiPropertyOptional({ example: '0912345678' })
    @IsOptional()
    @Matches(/^(0[3|5|7|8|9])+([0-9]{8})$/, { message: 'Số điện thoại không hợp lệ' })
    phone?: string;

    @ApiPropertyOptional({ example: 'https://link-anh.com/avatar.jpg' })
    @IsOptional()
    @IsString()
    avatar?: string;

    
}