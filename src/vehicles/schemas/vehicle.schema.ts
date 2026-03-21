import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';
import { RescueTeam } from '../../rescue-teams/schemas/rescue-team.schema';
import { VehicleType, VehicleStatus } from '../enums/vehicle.enum'; // 👈 Import Enums

export type VehicleDocument = HydratedDocument<Vehicle>;

@Schema({ timestamps: true })
export class Vehicle {
    // Tên gọi thân thiện (VD: Xuồng máy Yamaha 500W, Xe tải cẩu 5 tấn)
    @Prop({ required: true })
    name: string;

    // Biển kiểm soát hoặc Mã định danh (VD: CANO-01, 51C-12345)
    @Prop({ required: true, unique: true })
    plateNumber: string;

    // Loại phương tiện dùng Enum cho an toàn
    @Prop({ required: true, enum: VehicleType })
    type: string;

    // Sức chứa (Điều phối viên tính toán chở bao nhiêu nạn nhân/hàng hóa)
    @Prop({ required: true, min: 1 })
    capacity: number;

    // Tình trạng vật lý của xe
    @Prop({ default: VehicleStatus.AVAILABLE, enum: VehicleStatus })
    status: string;

    // 🛡️ Sửa lại thành Types.ObjectId để TypeScript không bị "ngáo"
    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'RescueTeam', default: null })
    assignedTeamId: Types.ObjectId | null;

    // 🛡️ Cờ "Xóa mềm": Dùng khi thanh lý xe hỏng nặng để không mất lịch sử
    @Prop({ default: true })
    isActive: boolean;
}

export const VehicleSchema = SchemaFactory.createForClass(Vehicle);