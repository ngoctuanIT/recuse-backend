import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type DonationDocument = HydratedDocument<Donation>;

@Schema({ timestamps: true })
export class Donation {
    @Prop({ required: true, unique: true })
    orderId: string; // Mã giao dịch tự gen (VD: DONATE_20260327153000)

    @Prop({ required: true, min: 10000 })
    amount: number; // Số tiền (VNĐ)

    @Prop()
    message: string; // Lời nhắn

    @Prop({ default: 'PENDING', enum: ['PENDING', 'SUCCESS', 'FAILED'] })
    status: string;

    @Prop()
    vnp_TransactionNo: string; // Mã giao dịch thật của VNPay (Lưu lại để đối soát sau này)
}

export const DonationSchema = SchemaFactory.createForClass(Donation);