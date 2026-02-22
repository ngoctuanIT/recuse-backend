import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config'; // 👈 1. Import ConfigService

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    // 👈 2. Inject ConfigService vào constructor
    constructor(private configService: ConfigService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            // 👇 3. Lấy Secret Key từ file .env (Nếu trên Render chưa set thì dùng tạm chuỗi fallback)
            secretOrKey: configService.get<string>('JWT_SECRET') || 'FALLBACK_SECRET_KEY_QUAN_TRONG',
        });
    }

    async validate(payload: any) {
        return { userId: payload.sub, username: payload.username, role: payload.role };
    }
}