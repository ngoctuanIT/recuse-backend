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

    // Ngưỡng cảnh báo hết hàng (Mặc định 10)
    @Prop({ required: true, min: 0, default: 10 })
    lowStockThreshold: number;

    // 👇 ĐÃ SỬA: Trả lại đúng bản chất của ghi chú (VD: Bảo quản nơi khô ráo, thùng móp nhẹ do vận chuyển)
    @Prop()
    description: string;

    // 👇 THÊM TRƯỜNG HẠN SỬ DỤNG: Dùng kiểu Date chuẩn của MongoDB
    @Prop({ type: Date, required: false })
    expirationDate: Date;

    // Xóa mềm (Cho phép ẩn vật phẩm thay vì xóa vĩnh viễn)
    @Prop({ default: true })
    isActive: boolean;
}

export const InventorySchema = SchemaFactory.createForClass(Inventory);

// 🛡️ INDEX CŨ: Tăng tốc độ tìm kiếm khi lọc hàng sắp hết số lượng (Low Stock)
InventorySchema.index({ isActive: 1, quantity: 1, lowStockThreshold: 1 });

// 🚀 INDEX MỚI (Tư duy Senior): Đánh index nòng cốt cho nghiệp vụ cảnh báo Hết Hạn Sử Dụng (FEFO)
InventorySchema.index({ isActive: 1, expirationDate: 1 });