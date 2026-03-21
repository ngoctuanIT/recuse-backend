import { Prop, Schema, SchemaFactory, raw } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';
import { User } from '../../users/schemas/user.schema';
import { RescueTeam } from '../../rescue-teams/schemas/rescue-team.schema';

export type RescueRequestDocument = HydratedDocument<RescueRequest>;

@Schema({ timestamps: true })
export class RescueRequest {
    @Prop({ unique: true, sparse: true })
    requestCode: string;

    // 1. SỬA TÊN BIẾN VÀ TYPE: Gọi là 'user' nếu muốn populate, hoặc giữ type ObjectId
    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
    userId: Types.ObjectId;

    @Prop({ required: true })
    description: string;

    @Prop([String])
    images: string[];

    // 2. BỔ SUNG ĐỦ TRẠNG THÁI
    @Prop({
        default: 'PENDING',
        enum: ['PENDING', 'VERIFIED', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'RESOLVED', 'CANCELLED']
    })
    status: string;

    // Sửa type lại cho đồng bộ chuẩn ObjectId
    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'RescueTeam', default: null })
    assignedTeamId: Types.ObjectId;

    @Prop({ default: 'LOW', enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] })
    urgencyLevel: string;

    // 3. KHÓA CHẶT TỌA ĐỘ (Bắt buộc phải có)
    @Prop(raw({
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point',
            required: true // Bắt buộc
        },
        coordinates: {
            type: [Number], // [Kinh độ, Vĩ độ]
            required: true  // Bắt buộc
        }
    }))
    location: {
        type: string;
        coordinates: number[];
    };
}

export const RescueRequestSchema = SchemaFactory.createForClass(RescueRequest);

// Index hoàn hảo cho việc tìm kiếm bán kính
RescueRequestSchema.index({ location: '2dsphere' });