import { PartialType } from '@nestjs/swagger'; // Cần cài: npm i @nestjs/swagger
import { CreateUserDto } from './create-user.dto';

// PartialType giúp biến tất cả trường của CreateUserDto thành Optional (không bắt buộc)
export class UpdateUserDto extends PartialType(CreateUserDto) { }