import { Injectable, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Inventory } from './schemas/inventory.schema';
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
import { UpdateStockDto } from './dto/update-stock.dto';

@Injectable()
export class InventoriesService {
    constructor(@InjectModel(Inventory.name) private inventoryModel: Model<Inventory>) { }

    // 1. TẠO MỚI
    async create(createDto: CreateInventoryDto) {
        try {
            const newItem = new this.inventoryModel({ ...createDto, isActive: true });
            return await newItem.save();
        } catch (error) {
            if (error.code === 11000) {
                throw new ConflictException('Vật phẩm này đã tồn tại trong kho!');
            }
            throw error;
        }
    }

    // 2. LẤY DANH SÁCH (Chỉ lấy hàng đang kích hoạt)
    async findAll() {
        return this.inventoryModel.find({ isActive: true }).sort({ category: 1, itemName: 1 }).exec();
    }

    // 3. XEM CHI TIẾT
    async findOne(id: string) {
        if (!Types.ObjectId.isValid(id)) throw new BadRequestException('ID không hợp lệ');
        const item = await this.inventoryModel.findOne({ _id: id, isActive: true }).exec();
        if (!item) throw new NotFoundException('Không tìm thấy vật phẩm');
        return item;
    }

    // 4. CẬP NHẬT THÔNG TIN CƠ BẢN (Không dùng để đổi số lượng)
    async update(id: string, updateDto: UpdateInventoryDto) {
        if (!Types.ObjectId.isValid(id)) throw new BadRequestException('ID không hợp lệ');

        // Cấm update số lượng qua đường này
        const safeData = { ...updateDto };
        delete safeData['quantity'];

        const item = await this.inventoryModel.findOneAndUpdate(
            { _id: id, isActive: true },
            { $set: safeData },
            { new: true }
        ).exec();

        if (!item) throw new NotFoundException('Không tìm thấy vật phẩm');
        return item;
    }

    // 5. NHẬP/XUẤT KHO (Atomic Update $inc - Chống Race Condition)
    async updateStock(id: string, updateStockDto: UpdateStockDto) {
        if (!Types.ObjectId.isValid(id)) throw new BadRequestException('ID không hợp lệ');

        const { quantityChange } = updateStockDto;
        const filter: any = { _id: id, isActive: true };

        // 🛡️ CHỐT CHẶN: Nếu là Xuất kho (số âm), kiểm tra DB xem có đủ hàng không
        if (quantityChange < 0) {
            filter.quantity = { $gte: Math.abs(quantityChange) };
        }

        const updatedItem = await this.inventoryModel.findOneAndUpdate(
            filter,
            { $inc: { quantity: quantityChange } },
            { new: true }
        );

        if (!updatedItem) {
            throw new BadRequestException(
                quantityChange < 0
                    ? 'Thất bại! Kho KHÔNG ĐỦ HÀNG để xuất hoặc vật phẩm không tồn tại.'
                    : 'Thất bại! Không tìm thấy vật phẩm.'
            );
        }

        // 🔔 Cảnh báo nếu số lượng rớt xuống dưới ngưỡng
        const isLowStock = updatedItem.quantity <= updatedItem.lowStockThreshold;

        return {
            message: quantityChange > 0 ? 'Nhập kho thành công' : 'Xuất kho thành công',
            warning: isLowStock ? `CẢNH BÁO: Số lượng ${updatedItem.itemName} trong kho đang ở mức thấp (${updatedItem.quantity})` : null,
            data: updatedItem
        };
    }

    // 6. XÓA MỀM (Thanh lý / Ngừng hỗ trợ vật phẩm này)
    async remove(id: string) {
        if (!Types.ObjectId.isValid(id)) throw new BadRequestException('ID không hợp lệ');
        const item = await this.inventoryModel.findOneAndUpdate(
            { _id: id, isActive: true },
            { $set: { isActive: false } },
            { new: true }
        ).exec();

        if (!item) throw new NotFoundException('Không tìm thấy vật phẩm');
        return { message: 'Đã ngừng cung cấp mặt hàng này' };
    }
}