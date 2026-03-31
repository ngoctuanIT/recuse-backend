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

    // 👇 THÊM MỚI: Mảng lưu vết vật tư xuất kho (Inventory)
    @Prop([{
        inventoryId: { type: MongooseSchema.Types.ObjectId, ref: 'Inventory', required: true },
        quantity: { type: Number, required: true, min: 1 }
    }])
    allocatedSupplies: {
        inventoryId: Types.ObjectId;
        quantity: number;
    }[];

    @Prop()
    evidenceImage: string;

    @Prop()
    cancelReason: string;

    @Prop({ type: Date })
    completedAt: Date;

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

RescueRequestSchema.index({ location: '2dsphere' });
RescueRequestSchema.index({ status: 1, createdAt: -1 });