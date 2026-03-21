import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { InventoryCategory } from '../enums/inventory.enum'; // 👈 Import Enum vào

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

    // Phân loại hàng hóa (Dùng Enum chuẩn mực)
    @Prop({
        required: true,
        enum: InventoryCategory,
        default: InventoryCategory.OTHER
    })
    category: string;

    // 🛡️ BỔ SUNG: Ngưỡng cảnh báo hết hàng (Mặc định 10)
    @Prop({ required: true, min: 0, default: 10 })
    lowStockThreshold: number;

    // Ghi chú thêm (VD: Hạn sử dụng tháng 12/2026)
    @Prop()
    description: string;

    // 🛡️ BỔ SUNG: Xóa mềm (Cho phép ẩn vật phẩm thay vì xóa vĩnh viễn)
    @Prop({ default: true })
    isActive: boolean;
}

export const InventorySchema = SchemaFactory.createForClass(Inventory);

// 🛡️ BỔ SUNG INDEX: Đánh index để tăng tốc độ tìm kiếm khi lọc hàng sắp hết
InventorySchema.index({ isActive: 1, quantity: 1, lowStockThreshold: 1 });