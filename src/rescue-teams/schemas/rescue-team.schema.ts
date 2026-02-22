import { Prop, Schema, SchemaFactory, raw } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';
import { User } from '../../users/schemas/user.schema';
import { Vehicle } from '../../vehicles/schemas/vehicle.schema'; // 👈 Import bảng Vehicle vào

export type RescueTeamDocument = HydratedDocument<RescueTeam>;

@Schema({ timestamps: true })
export class RescueTeam {
    @Prop({ required: true, unique: true })
    teamName: string;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
    leaderId: User;

    @Prop([{ type: MongooseSchema.Types.ObjectId, ref: 'User' }])
    members: User[];

    // 👇 ĐÃ SỬA: Một đội có thể được cấp 1 hoặc nhiều phương tiện đi kèm
    @Prop([{ type: MongooseSchema.Types.ObjectId, ref: 'Vehicle' }])
    vehicles: Vehicle[];

    @Prop({ default: 'AVAILABLE', enum: ['AVAILABLE', 'BUSY', 'OFFLINE'] })
    status: string;

    @Prop(raw({
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point',
        },
        coordinates: {
            type: [Number],
            default: [105.854444, 21.028511],
        }
    }))
    currentLocation: {
        type: string;
        coordinates: number[];
    };
}

export const RescueTeamSchema = SchemaFactory.createForClass(RescueTeam);
RescueTeamSchema.index({ currentLocation: '2dsphere' });