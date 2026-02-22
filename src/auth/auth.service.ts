import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { CountersService } from '../counters/schemas/counter.service';

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
        private countersService: CountersService,
    ) { }

    // 1. ĐĂNG KÝ: Xử lý nghiệp vụ phức tạp trước khi lưu
    async signUp(createUserDto: CreateUserDto) {
        const { username, password, ...rest } = createUserDto;

        // Kiểm tra trùng username
        const userExists = await this.usersService.findOne(username);
        if (userExists) {
            throw new BadRequestException('Tài khoản này đã tồn tại trên hệ thống!');
        }

        // Hash mật khẩu
        const salt = await bcrypt.genSalt();
        const hashedPassword = await bcrypt.hash(password, salt);

        // Tạo mã định danh tự động (USR-00001)
        const seq = await this.countersService.getNextSequence('user');
        const userCode = `USR-${seq.toString().padStart(5, '0')}`;

        // Gọi kho dữ liệu (UsersService) để lưu
        const newUser = await this.usersService.create({
            username,
            password: hashedPassword,
            userCode,
            ...rest,
        });

        return {
            message: 'Đăng ký tài khoản thành công',
            userCode: newUser.userCode,
            username: newUser.username,
        };
    }

    // 2. ĐĂNG NHẬP: Kiểm tra danh tính và cấp "vé" (JWT)
    async signIn(username: string, pass: string) {
        const user = await this.usersService.findOne(username);

        if (!user) {
            throw new UnauthorizedException('Tài khoản hoặc mật khẩu không chính xác');
        }

        const isMatch = await bcrypt.compare(pass, user.password);
        if (!isMatch) {
            throw new UnauthorizedException('Tài khoản hoặc mật khẩu không chính xác');
        }

        // Payload chứa thông tin cơ bản để các module khác dùng mà không cần query DB
        const payload = {
            sub: user._id,
            username: user.username,
            role: user.role,
            userCode: user.userCode
        };

        return {
            access_token: await this.jwtService.signAsync(payload),
            user: {
                _id: user._id,
                userCode: user.userCode,
                fullName: user.fullName,
                role: user.role,
            },
        };
    }
}