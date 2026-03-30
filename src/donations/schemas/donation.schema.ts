import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types, Schema as MongooseSchema } from 'mongoose';
import { DonationStatus } from '../enums/donation-status.enum';

export type DonationDocument = HydratedDocument<Donation>;

@Schema({ timestamps: true })
export class Donation {
    // THÊM MỚI: Liên kết đơn hàng với người dùng
    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true, index: true })
    userId: Types.ObjectId;

    @Prop({ required: true, unique: true, index: true })
    orderId: string;

    @Prop({ required: true, min: 10000 })
    amount: number;

    @Prop({ default: '' })
    message: string;

    @Prop({
        default: DonationStatus.PENDING,
        enum: DonationStatus,
        index: true,
    })
    status: DonationStatus;

    @Prop({ type: String, default: null })
    vnp_TransactionNo: string | null;
}

export const DonationSchema = SchemaFactory.createForClass(Donation);