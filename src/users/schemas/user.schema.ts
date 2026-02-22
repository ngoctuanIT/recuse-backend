import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
// 👇 1. Import cái Enum bạn vừa tạo vào đây (Sửa lại đường dẫn cho đúng với project của bạn)
import { Role } from '../../auth/enums/role.enum';

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

    @Prop({ required: true })
    phone: string;

    // 👇 2. Đổi lại cách khai báo Enum
    @Prop({
        type: String,
        enum: Object.values(Role), // Tự động lấy tất cả các giá trị trong file role.enum.ts
        default: Role.CITIZEN      // Dùng luôn biến Role.CITIZEN cho an toàn, đỡ gõ sai chính tả
    })
    role: string;
}

export const UserSchema = SchemaFactory.createForClass(User);