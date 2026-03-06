import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { Role } from '../../auth/enums/role.enum'; // Đảm bảo đường dẫn đúng

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {
    @Prop({ required: true, unique: true })
    userCode: string;

    @Prop({ required: true, unique: true })
    username: string;

    @Prop({ required: true })
    password: string;

    @Prop({ required: true })
    fullName: string;

    // 👇 1. SỬA: Thêm unique: true để đảm bảo SĐT không bị trùng
    @Prop({ required: true, unique: true })
    phone: string;

    @Prop({
        type: String,
        enum: Object.values(Role),
        default: Role.CITIZEN
    })
    role: string;

    // 👇 2. THÊM MỚI: Cờ đánh dấu Xóa mềm (Soft Delete)
    @Prop({ default: true })
    isActive: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);