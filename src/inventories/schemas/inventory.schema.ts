import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type InventoryDocument = HydratedDocument<Inventory>;

@Schema({ timestamps: true })
export class Inventory {
    // Tên vật phẩm (VD: Mì tôm Hảo Hảo, Áo phao người lớn)
    @Prop({ required: true, unique: true })
    itemName: string;

    // Số lượng tồn kho hiện tại
    @Prop({ required: true, min: 0, default: 0 })
    quantity: number;

    // Đơn vị tính (VD: Thùng, Chiếc, Chai, Kg)
    @Prop({ required: true })
    unit: string;

    // Phân loại hàng hóa
    @Prop({
        enum: ['FOOD', 'WATER', 'MEDICAL', 'EQUIPMENT', 'OTHER'],
        default: 'OTHER'
    })
    category: string;

    // Ghi chú thêm (VD: Hạn sử dụng tháng 12/2026)
    @Prop()
    description: string;
}

export const InventorySchema = SchemaFactory.createForClass(Inventory);