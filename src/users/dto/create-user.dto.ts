import { IsNotEmpty, IsString, MinLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
    @ApiProperty({
        example: 'nguyenvana',
        description: 'Tên đăng nhập (Duy nhất)',
    })
    @IsNotEmpty({ message: 'Tên đăng nhập không được để trống' })
    @IsString()
    username: string;

    @ApiProperty({
        example: '123456',
        description: 'Mật khẩu (Tối thiểu 6 ký tự)',
        minLength: 6
    })
    @IsNotEmpty({ message: 'Mật khẩu không được để trống' })
    @MinLength(6, { message: 'Mật khẩu phải dài ít nhất 6 ký tự' })
    password: string;

    @ApiProperty({
        example: 'Nguyễn Văn A',
        description: 'Họ và tên đầy đủ'
    })
    @IsNotEmpty({ message: 'Họ và tên không được để trống' })
    @IsString()
    fullName: string;

    @ApiProperty({
        example: '0987654321',
        description: 'Số điện thoại liên lạc (10 số, bắt đầu bằng số 0)'
    })
    @IsNotEmpty({ message: 'Số điện thoại không được để trống' })
    // 👇 Nâng cấp Senior: Chặn user nhập SĐT bậy bạ
    @Matches(/^(0[3|5|7|8|9])+([0-9]{8})$/, {
        message: 'Số điện thoại không hợp lệ (Phải là số ĐT Việt Nam hợp lệ)'
    })
    phone: string;
}