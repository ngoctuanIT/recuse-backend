import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Types, Connection } from 'mongoose';
import { Vehicle } from './schemas/vehicle.schema';

// 👇 Phải import thêm bảng Đội cứu hộ để xử lý rác dữ liệu
import { RescueTeam } from '../rescue-teams/schemas/rescue-team.schema';

// Import DTOs & Enums
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { UpdateVehicleStatusDto } from './dto/update-vehicle-status.dto';
import { VehicleStatus } from './enums/vehicle.enum';

@Injectable()
export class VehiclesService {
    constructor(
        @InjectModel(Vehicle.name) private vehicleModel: Model<Vehicle>,
        @InjectModel(RescueTeam.name) private rescueTeamModel: Model<RescueTeam>, // 👈 Inject Model Đội
        @InjectConnection() private connection: Connection // 👈 Inject Connection cho Transaction
    ) { }

    // 1. TẠO MỚI
    async create(createDto: CreateVehicleDto) {
        try {
            const newVehicle = new this.vehicleModel({
                ...createDto,
                status: VehicleStatus.AVAILABLE,
                isActive: true
            });
            return await newVehicle.save();
        } catch (error) {
            if (error.code === 11000) {
                throw new BadRequestException('Biển số hoặc Mã phương tiện này đã tồn tại!');
            }
            throw error;
        }
    }

    // 2. LẤY TẤT CẢ
    async findAll() {
        return this.vehicleModel
            .find({ isActive: true })
            .populate('assignedTeamId', 'teamName')
            .exec();
    }

    // 3. TÌM XE ĐANG RẢNH
    async findAvailable() {
        return this.vehicleModel
            .find({
                status: VehicleStatus.AVAILABLE,
                isActive: true,
                assignedTeamId: null
            })
            .exec();
    }

    // 4. XEM CHI TIẾT
    async findOne(id: string) {
        if (!Types.ObjectId.isValid(id)) throw new BadRequestException('ID không hợp lệ');

        const vehicle = await this.vehicleModel
            .findOne({ _id: id, isActive: true })
            .populate('assignedTeamId', 'teamName')
            .exec();

        if (!vehicle) throw new NotFoundException('Không tìm thấy phương tiện hoặc đã bị thanh lý');
        return vehicle;
    }

    // 5. CẬP NHẬT THÔNG TIN CƠ BẢN
    async update(id: string, updateDto: UpdateVehicleDto) {
        if (!Types.ObjectId.isValid(id)) throw new BadRequestException('ID không hợp lệ');

        // 🛡️ CHỐT CHẶN: Bóc tách rủi ro, không cho phép sửa trạng thái qua đường này
        const safeUpdateData = { ...updateDto };
        delete safeUpdateData['status'];
        delete safeUpdateData['assignedTeamId'];
        delete safeUpdateData['isActive'];

        const vehicle = await this.vehicleModel.findOneAndUpdate(
            { _id: id, isActive: true },
            { $set: safeUpdateData },
            { new: true }
        ).populate('assignedTeamId', 'teamName').exec();

        if (!vehicle) throw new NotFoundException('Không tìm thấy phương tiện');
        return vehicle;
    }

    // 6. CẬP NHẬT TRẠNG THÁI HOẠT ĐỘNG (BỌC TRANSACTION)
    async updateStatus(id: string, updateDto: UpdateVehicleStatusDto) {
        if (!Types.ObjectId.isValid(id)) throw new BadRequestException('ID không hợp lệ');

        const session = await this.connection.startSession();
        session.startTransaction();

        try {
            const vehicle = await this.vehicleModel.findOne({ _id: id, isActive: true }).session(session);
            if (!vehicle) throw new NotFoundException('Không tìm thấy phương tiện');

            const newStatus = updateDto.status;

            // 🛡️ Nếu xe đang được giao cho Đội, mà giờ báo hỏng/bảo trì -> Phải thu hồi xe
            if (vehicle.assignedTeamId && (newStatus === VehicleStatus.BROKEN || newStatus === VehicleStatus.MAINTENANCE)) {

                // Rút ID xe ra khỏi túi của Đội cứu hộ
                await this.rescueTeamModel.findByIdAndUpdate(
                    vehicle.assignedTeamId,
                    { $pull: { vehicles: vehicle._id } },
                    { session }
                );

                // Tước quyền sở hữu trên xe
                vehicle.assignedTeamId = null;
            }

            // Nếu cập nhật thành AVAILABLE, bắt buộc phải xóa assignedTeamId để xe thực sự Rảnh
            if (newStatus === VehicleStatus.AVAILABLE) {
                if (vehicle.assignedTeamId) {
                    await this.rescueTeamModel.findByIdAndUpdate(
                        vehicle.assignedTeamId,
                        { $pull: { vehicles: vehicle._id } },
                        { session }
                    );
                }
                vehicle.assignedTeamId = null;
            }

            vehicle.status = newStatus;
            await vehicle.save({ session });

            await session.commitTransaction();
            return vehicle;

        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }

    // 7. THANH LÝ PHƯƠNG TIỆN (SOFT DELETE + DỌN RÁC)
    async remove(id: string) {
        if (!Types.ObjectId.isValid(id)) throw new BadRequestException('ID không hợp lệ');

        const session = await this.connection.startSession();
        session.startTransaction();

        try {
            const vehicle = await this.vehicleModel.findOne({ _id: id, isActive: true }).session(session);
            if (!vehicle) throw new NotFoundException('Không tìm thấy phương tiện');

            // 🛡️ Nếu xe đang nằm trong đội, phải rút nó ra khỏi túi của đội trước
            if (vehicle.assignedTeamId) {
                await this.rescueTeamModel.findByIdAndUpdate(
                    vehicle.assignedTeamId,
                    { $pull: { vehicles: vehicle._id } },
                    { session }
                );
            }

            // Tiến hành xóa mềm và cập nhật trạng thái
            vehicle.isActive = false;
            vehicle.status = VehicleStatus.BROKEN;
            vehicle.assignedTeamId = null;
            await vehicle.save({ session });

            await session.commitTransaction();
            return { message: 'Đã thanh lý phương tiện thành công', vehicle };

        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }
}