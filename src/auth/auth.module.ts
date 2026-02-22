import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy';
import { CountersModule } from 'src/counters/schemas/counter.module';
import { ConfigModule, ConfigService } from '@nestjs/config'; // 👈 1. Import thêm 2 cái này

@Module({
  imports: [
    UsersModule,
    PassportModule,
    CountersModule,
    // 👇 2. Đổi từ register sang registerAsync để đọc file .env
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        global: true,
        secret: configService.get<string>('JWT_SECRET'), // Lấy chìa khóa từ .env
        signOptions: { expiresIn: '1d' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy
  ],
})
export class AuthModule { }