import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Inventory } from './schemas/inventory.schema';
import { CreateInventoryDto } from './dto/create-inventory.dto';

@Injectable()
export class InventoriesService {
    constructor(@InjectModel(Inventory.name) private inventoryModel: Model<Inventory>) { }

    // 1. Nhập mặt hàng mới vào hệ thống
    async create(createDto: CreateInventoryDto) {
        try {
            const newItem = new this.inventoryModel(createDto);
            return await newItem.save();
        } catch (error) {
            if (error.code === 11000) {
                throw new BadRequestException('Mặt hàng này đã tồn tại trong kho!');
            }
            throw error;
        }
    }

    // 2. Xem toàn bộ kho hàng
    async findAll() {
        return this.inventoryModel.find().sort({ category: 1, itemName: 1 }).exec();
    }

    // 3. Nhập / Xuất kho (Cộng trừ số lượng)
    async updateStock(id: string, amount: number) {
        if (!Types.ObjectId.isValid(id)) throw new BadRequestException('ID không hợp lệ');

        // Tìm món hàng trước để check xem xuất kho có bị âm số lượng không
        const item = await this.inventoryModel.findById(id);
        if (!item) throw new NotFoundException('Không tìm thấy vật phẩm này');

        if (item.quantity + amount < 0) {
            throw new BadRequestException(`Trong kho chỉ còn ${item.quantity} ${item.unit}, không đủ để xuất!`);
        }

        // Tiến hành cập nhật số lượng (Dùng $inc của MongoDB để cộng/trừ trực tiếp)
        return this.inventoryModel.findByIdAndUpdate(
            id,
            { $inc: { quantity: amount } },
            { new: true }
        );
    }
}