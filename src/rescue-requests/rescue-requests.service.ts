import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

// --- IMPORT DTO ---
import { CreateRescueRequestDto } from './dto/create-rescue-request.dto';
import { QueryRescueRequestDto } from './dto/query-rescue-request.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { AssignRequestDto } from './dto/assign-request.dto'; // 👈 DTO mới đã được import

// --- IMPORT SCHEMAS & SERVICES ---
import { RescueRequest } from './schemas/rescue-request.schema';
import { CountersService } from '../counters/schemas/counter.service';
import { RescueTeam } from '../rescue-teams/schemas/rescue-team.schema';
import { Vehicle } from '../vehicles/schemas/vehicle.schema';
import { Inventory } from '../inventories/schemas/inventory.schema';

@Injectable()
export class RescueRequestsService {
  constructor(
    @InjectModel(RescueRequest.name) private rescueRequestModel: Model<RescueRequest>,
    @InjectModel(RescueTeam.name) private rescueTeamModel: Model<RescueTeam>,
    @InjectModel(Vehicle.name) private vehicleModel: Model<Vehicle>,
    @InjectModel(Inventory.name) private inventoryModel: Model<Inventory>,
    private counterService: CountersService,
  ) { }

  // =========================================================================
  // 1. CÁC HÀM TẠO VÀ LẤY DANH SÁCH CƠ BẢN
  // =========================================================================

  async create(createDto: CreateRescueRequestDto, userId: string) {
    const seq = await this.counterService.getNextSequence('rescue_request');
    const requestCode = `RD-${seq.toString().padStart(4, '0')}`;

    const newRequest = new this.rescueRequestModel({
      userId: userId,
      requestCode: requestCode,
      description: createDto.description,
      images: createDto.images || [],
      status: 'PENDING',
      location: {
        type: 'Point',
        coordinates: [createDto.longitude, createDto.latitude],
      },
    });

    return newRequest.save();
  }

  async findNearby(query: QueryRescueRequestDto) {
    const { latitude, longitude, radius = 3000 } = query;
    return this.rescueRequestModel.find({
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates: [longitude, latitude] },
          $maxDistance: radius,
        },
      },
      status: 'PENDING'
    }).populate('userId', 'fullName phone').exec();
  }

  async findAll() {
    return this.rescueRequestModel
      .find()
      .populate('userId', 'fullName phone')
      .populate('assignedTeamId', 'teamName')
      .sort({ createdAt: -1 })
      .exec();
  }

  // =========================================================================
  // 2. CÁC HÀM LUỒNG NGHIỆP VỤ CỐT LÕI
  // =========================================================================

  // [COORDINATOR] Xác minh mức độ khẩn cấp của đơn
  async verifyRequest(id: string, urgencyLevel: string) {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('Định dạng ID không hợp lệ');

    const updated = await this.rescueRequestModel
      .findByIdAndUpdate(
        id,
        { status: 'VERIFIED', urgencyLevel },
        { returnDocument: 'after' }
      ).exec();

    if (!updated) throw new NotFoundException('Không tìm thấy yêu cầu cứu hộ');
    return updated;
  }

  // [COORDINATOR] Phân công Đội, Xe và Vật tư (Luồng Dispatch)
  async assignTeam(id: string, assignDto: AssignRequestDto) {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('Định dạng ID không hợp lệ');

    // Bước 1: Kiểm tra đơn cứu hộ
    const request = await this.rescueRequestModel.findById(id);
    if (!request) throw new NotFoundException('Không tìm thấy yêu cầu cứu hộ này');
    if (request.status !== 'PENDING' && request.status !== 'VERIFIED') {
      throw new BadRequestException('Đơn này đã được xử lý hoặc đã hoàn thành!');
    }

    // Bước 2: Kiểm tra Đội cứu hộ
    const team = await this.rescueTeamModel.findById(assignDto.teamId);
    if (!team) throw new NotFoundException('Không tìm thấy Đội cứu hộ');
    // Bỏ comment dòng dưới nếu schema Team của bạn có trường status
    // if (team.status !== 'AVAILABLE') throw new BadRequestException('Đội cứu hộ này đang bận!');

    // Bước 3: Xử lý Phương tiện (Khóa xe)
    if (assignDto.vehicleId) {
      const vehicle = await this.vehicleModel.findById(assignDto.vehicleId);
      if (!vehicle) throw new NotFoundException('Không tìm thấy phương tiện');
      // Bỏ comment dòng dưới nếu schema Vehicle của bạn có trường status
      // if (vehicle.status !== 'AVAILABLE') throw new BadRequestException('Phương tiện này đang không sẵn sàng!');

      await this.vehicleModel.findByIdAndUpdate(assignDto.vehicleId, { status: 'IN_USE' });
    }

    // Bước 4: Xử lý Vật tư (Trừ kho)
    if (assignDto.supplies && assignDto.supplies.length > 0) {
      for (const item of assignDto.supplies) {
        const inventory = await this.inventoryModel.findById(item.inventoryId);
        if (!inventory) throw new NotFoundException(`Không tìm thấy vật tư ID: ${item.inventoryId}`);
        if (inventory.quantity < item.quantity) {
          throw new BadRequestException(`Kho không đủ! ${inventory.itemName || 'Vật tư này'} chỉ còn ${inventory.quantity}`);
        }

        // Trừ số lượng trong kho
        await this.inventoryModel.findByIdAndUpdate(item.inventoryId, {
          $inc: { quantity: -item.quantity }
        });
      }
    }

    // Bước 5: Cập nhật trạng thái Đội cứu hộ
    await this.rescueTeamModel.findByIdAndUpdate(assignDto.teamId, { status: 'BUSY' });

    // Bước 6: Lưu thông tin điều phối vào Đơn cứu hộ
    const updatedRequest = await this.rescueRequestModel.findByIdAndUpdate(
      id,
      {
        assignedTeamId: assignDto.teamId,
        vehicleId: assignDto.vehicleId,
        supplies: assignDto.supplies,
        status: 'ASSIGNED'
      },
      { returnDocument: 'after' }
    )
      .populate('assignedTeamId')
      .exec();

    return {
      message: 'Điều phối cứu hộ thành công!',
      data: updatedRequest
    };
  }

  // [TEAM] Cập nhật tiến độ cứu hộ (VD: Đang di chuyển, Đang tiếp cận...)
  async updateStatus(id: string, updateStatusDto: UpdateStatusDto) {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('Định dạng ID không hợp lệ');

    const updatedRequest = await this.rescueRequestModel
      .findByIdAndUpdate(id, { status: updateStatusDto.status }, { returnDocument: 'after' })
      .exec();
    if (!updatedRequest) throw new NotFoundException('Không tìm thấy yêu cầu cứu hộ này');
    return updatedRequest;
  }

  // [CITIZEN] Xác nhận đã an toàn (Đóng đơn)
  async confirmRescued(id: string, userId: string) {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('Định dạng ID không hợp lệ');

    const request = await this.rescueRequestModel.findOne({ _id: id, userId } as any);

    if (!request) {
      throw new NotFoundException('Không tìm thấy đơn hoặc bạn không có quyền xác nhận đơn này');
    }

    request.status = 'COMPLETED';
    return request.save();
  }

  // =========================================================================
  // 3. CÁC HÀM TRUY VẤN CHI TIẾT
  // =========================================================================

  async findOne(id: string) {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('Định dạng ID không hợp lệ');

    const request = await this.rescueRequestModel
      .findById(id)
      .populate('userId', 'fullName phone')
      .populate('assignedTeamId')
      .exec();

    if (!request) throw new NotFoundException('Không tìm thấy yêu cầu cứu hộ');
    return request;
  }

  async findMyRequests(userId: string) {
    return this.rescueRequestModel
      .find({ userId } as any)
      .sort({ createdAt: -1 })
      .exec();
  }

  async findAssignedTasks(teamId: string) {
    return this.rescueRequestModel
      .find({ assignedTeamId: teamId } as any)
      .sort({ createdAt: -1 })
      .populate('userId', 'fullName phone location description images')
      .exec();
  }
}