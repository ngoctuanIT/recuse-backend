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
        // 👇 Lấy phone ra để kiểm tra thay vì username
        const { phone, password, ...rest } = createUserDto;

        // 👇 Kiểm tra trùng Số điện thoại
        const userExists = await this.usersService.findByPhone(phone);
        if (userExists) {
            throw new BadRequestException('Số điện thoại này đã được đăng ký trên hệ thống!');
        }

        // Hash mật khẩu
        const salt = await bcrypt.genSalt();
        const hashedPassword = await bcrypt.hash(password, salt);

        // Tạo mã định danh tự động (USR-00001)
        const seq = await this.countersService.getNextSequence('user');
        const userCode = `USR-${seq.toString().padStart(5, '0')}`;

        // Gọi kho dữ liệu (UsersService) để lưu
        const newUser = await this.usersService.create({
            phone,
            password: hashedPassword,
            userCode,
            ...rest,
        });

        return {
            message: 'Đăng ký tài khoản thành công',
            userCode: newUser.userCode,
            phone: newUser.phone, // Trả về phone cho Frontend
        };
    }

    // 2. ĐĂNG NHẬP: Kiểm tra danh tính và cấp "vé" (JWT)
    // 👇 Đổi tham số username thành phone
    async signIn(phone: string, pass: string) {
        // 👇 Tìm user qua SĐT (Hàm findByPhone đã tự động chặn các user bị khóa)
        const user = await this.usersService.findByPhone(phone);

        if (!user) {
            throw new UnauthorizedException('Số điện thoại hoặc mật khẩu không chính xác');
        }

        const isMatch = await bcrypt.compare(pass, user.password);
        if (!isMatch) {
            throw new UnauthorizedException('Số điện thoại hoặc mật khẩu không chính xác');
        }

        // Payload chứa thông tin cơ bản để các module khác dùng mà không cần query DB
        const payload = {
            sub: user._id,
            phone: user.phone,       // Cập nhật payload dùng phone
            username: user.username, // Có thể giữ lại nếu hệ thống của bạn vẫn cần dùng
            role: user.role,
            userCode: user.userCode
        };

        return {
            access_token: await this.jwtService.signAsync(payload),
            user: {
                _id: user._id,
                userCode: user.userCode,
                fullName: user.fullName,
                phone: user.phone,
                role: user.role,
            },
        };
    }
}