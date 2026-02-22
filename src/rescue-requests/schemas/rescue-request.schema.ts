import { Prop, Schema, SchemaFactory, raw } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';
import { User } from '../../users/schemas/user.schema';
// Import chính xác class RescueTeam từ module của bạn
import { RescueTeam } from '../../rescue-teams/schemas/rescue-team.schema';

export type RescueRequestDocument = HydratedDocument<RescueRequest>;

@Schema({ timestamps: true })
export class RescueRequest {
    @Prop({ unique: true, sparse: true })
    requestCode: string;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
    userId: User;

    @Prop({ required: true })
    description: string;

    @Prop([String])
    images: string[];

    // Đã bổ sung trạng thái 'VERIFIED' cho Điều phối viên
    @Prop({
        default: 'PENDING',
        enum: ['PENDING', 'VERIFIED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']
    })
    status: string;

    // Đã liên kết chuẩn xác với bảng RescueTeam
    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'RescueTeam', default: null })
    assignedTeamId: RescueTeam;

    @Prop({ default: 'LOW', enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] })
    urgencyLevel: string;

    // Cấu trúc GeoJSON chuẩn (Đã xóa index dư thừa bên trong)
    @Prop(raw({
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number], // [Kinh độ, Vĩ độ]
        }
    }))
    location: {
        type: string;
        coordinates: number[];
    };
}

export const RescueRequestSchema = SchemaFactory.createForClass(RescueRequest);

// Đánh index 2dsphere ở ngoài cùng là chuẩn và tối ưu nhất của Mongoose
RescueRequestSchema.index({ location: '2dsphere' });