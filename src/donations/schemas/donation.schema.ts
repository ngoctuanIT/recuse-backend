import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { DonationStatus } from '../enums/donation-status.enum';

export type DonationDocument = HydratedDocument<Donation>;

@Schema({ timestamps: true })
export class Donation {
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