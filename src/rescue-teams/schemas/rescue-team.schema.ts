import { Prop, Schema, SchemaFactory, raw } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';
import { User } from '../../users/schemas/user.schema';
import { Vehicle } from '../../vehicles/schemas/vehicle.schema';

export type RescueTeamDocument = HydratedDocument<RescueTeam>;

@Schema({ timestamps: true })
export class RescueTeam {
    @Prop({ required: true, unique: true })
    teamName: string;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
    leaderId: User;

    @Prop([{ type: MongooseSchema.Types.ObjectId, ref: 'User' }])
    members: User[];

    @Prop([{ type: MongooseSchema.Types.ObjectId, ref: 'Vehicle' }])
    vehicles: Vehicle[];

    @Prop({ default: 'AVAILABLE', enum: ['AVAILABLE', 'BUSY', 'OFFLINE'] })
    status: string;

    @Prop({ default: true })
    isActive: boolean;

    // 🛡️ Đã cập nhật chuẩn GeoJSON, bắt buộc có tọa độ, không dùng default
    @Prop(raw({
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point',
        },
        coordinates: {
            type: [Number],
            required: true, // Ép buộc phải lưu tọa độ thật
        }
    }))
    currentLocation: {
        type: string;
        coordinates: number[]; // [Kinh độ, Vĩ độ]
    };
}

export const RescueTeamSchema = SchemaFactory.createForClass(RescueTeam);
// Index dùng cho query tọa độ địa lý (Tìm kiếm bán kính)
RescueTeamSchema.index({ currentLocation: '2dsphere' });