import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Vehicle } from './schemas/vehicle.schema';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleStatusDto } from './dto/update-vehicle-status.dto';

@Injectable()
export class VehiclesService {
    constructor(@InjectModel(Vehicle.name) private vehicleModel: Model<Vehicle>) { }

    async create(createDto: CreateVehicleDto) {
        try {
            const newVehicle = new this.vehicleModel(createDto);
            return await newVehicle.save();
        } catch (error) {
            if (error.code === 11000) {
                throw new BadRequestException('Biển số hoặc Mã phương tiện này đã tồn tại!');
            }
            throw error;
        }
    }

    async findAll() {
        return this.vehicleModel.find().populate('assignedTeamId', 'teamName').exec();
    }

    async findAvailable() {
        return this.vehicleModel.find({ status: 'AVAILABLE', assignedTeamId: null }).exec();
    }

    async findOne(id: string) {
        if (!Types.ObjectId.isValid(id)) throw new BadRequestException('ID không hợp lệ');
        const vehicle = await this.vehicleModel.findById(id).populate('assignedTeamId', 'teamName').exec();
        if (!vehicle) throw new NotFoundException('Không tìm thấy phương tiện');
        return vehicle;
    }

    async updateStatus(id: string, updateDto: UpdateVehicleStatusDto) {
        if (!Types.ObjectId.isValid(id)) throw new BadRequestException('ID không hợp lệ');
        const vehicle = await this.vehicleModel.findByIdAndUpdate(
            id,
            { status: updateDto.status },
            { new: true }
        );
        if (!vehicle) throw new NotFoundException('Không tìm thấy phương tiện');
        return vehicle;
    }
}