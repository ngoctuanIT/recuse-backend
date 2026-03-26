import { Prop, Schema, SchemaFactory, raw } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';
import { User } from '../../users/schemas/user.schema';
import { RescueTeam } from '../../rescue-teams/schemas/rescue-team.schema';

export type RescueRequestDocument = HydratedDocument<RescueRequest>;

@Schema({ timestamps: true })
export class RescueRequest {
    @Prop({ unique: true, sparse: true })
    requestCode: string;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
    userId: Types.ObjectId;

    @Prop({ required: true })
    description: string;

    // Ảnh người dân chụp lúc báo nạn
    @Prop([String])
    images: string[];

    @Prop({
        default: 'PENDING',
        enum: ['PENDING', 'VERIFIED', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'RESOLVED', 'CANCELLED']
    })
    status: string;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'RescueTeam', default: null })
    assignedTeamId: Types.ObjectId;

    @Prop({ default: 'LOW', enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] })
    urgencyLevel: string;

    // 👇 1. BỔ SUNG: Ảnh chứng thực do Đội cứu hộ chụp khi báo cáo COMPLETED
    @Prop()
    evidenceImage: string;

    // 👇 2. BỔ SUNG: Lý do hủy ca cứu hộ (Bắt buộc điền nếu status là CANCELLED)
    @Prop()
    cancelReason: string;

    // 👇 3. BỔ SUNG: Dấu mốc thời gian hoàn thành nhiệm vụ (Phục vụ đo lường KPI/Thống kê)
    @Prop({ type: Date })
    completedAt: Date;

    // KHÓA CHẶT TỌA ĐỘ
    @Prop(raw({
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point',
            required: true
        },
        coordinates: {
            type: [Number], // [Kinh độ, Vĩ độ]
            required: true
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
// Index phụ: Giúp Admin lọc nhanh các ca theo trạng thái và thời gian
RescueRequestSchema.index({ status: 1, createdAt: -1 });