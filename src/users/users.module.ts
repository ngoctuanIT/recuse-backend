import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
// Sửa đường dẫn import ở đây (từ entities -> schemas)
import { User, UserSchema } from './schemas/user.schema';

@Module({
  imports: [
    // Đăng ký Schema với Mongoose
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule { }