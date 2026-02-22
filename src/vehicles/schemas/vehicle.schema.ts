import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';
import { RescueTeam } from '../../rescue-teams/schemas/rescue-team.schema'; 

export type VehicleDocument = HydratedDocument<Vehicle>;

@Schema({ timestamps: true })
export class Vehicle {
    // Biển kiểm soát hoặc Mã định danh (VD: CANO-01, 51C-12345)
    @Prop({ required: true, unique: true })
    plateNumber: string;

    // Loại phương tiện
    @Prop({ required: true, enum: ['BOAT', 'CAR', 'HELICOPTER', 'TRUCK', 'OTHER'] })
    type: string;

    // Sức chứa (Rất quan trọng để Điều phối viên tính toán chở bao nhiêu nạn nhân/hàng hóa)
    @Prop({ required: true, min: 1 })
    capacity: number;

    // Tình trạng vật lý của xe (Manager quản lý cái này)
    @Prop({ default: 'AVAILABLE', enum: ['AVAILABLE', 'IN_USE', 'MAINTENANCE', 'BROKEN'] })
    status: string;

    // Chiếc xe này đang được giao cho Đội nào sử dụng? (Mặc định là null nếu đang nằm trong kho)
    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'RescueTeam', default: null })
    assignedTeamId: RescueTeam;
}

export const VehicleSchema = SchemaFactory.createForClass(Vehicle);