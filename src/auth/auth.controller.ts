import { Body, Controller, Post, HttpCode, HttpStatus, UseGuards, Request, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiProperty, ApiBearerAuth } from '@nestjs/swagger';
import { CreateUserDto } from '../users/dto/create-user.dto';

// DTO nhỏ dùng riêng cho Login
class LoginDto {
    @ApiProperty({ example: 'tuan', description: 'Tên đăng nhập' })
    username: string;

    @ApiProperty({ example: '123456', description: 'Mật khẩu' })
    password: string;
}

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    @Post('register')
    @ApiOperation({ summary: 'Đăng ký thành viên mới (Tự động tạo USR-CODE)' })
    signUp(@Body() createUserDto: CreateUserDto) {
        return this.authService.signUp(createUserDto);
    }

    @HttpCode(HttpStatus.OK)
    @Post('login')
    @ApiOperation({ summary: 'Đăng nhập lấy Access Token' })
    signIn(@Body() signInDto: LoginDto) {
        return this.authService.signIn(signInDto.username, signInDto.password);
    }

    @UseGuards(AuthGuard('jwt'))
    @Get('check-token')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Kiểm tra Token còn hạn hay không' })
    checkToken(@Request() req) {
        // Nếu đi qua được Guard, trả về thông tin trong Token
        return {
            valid: true,
            userInToken: req.user
        };
    }
}