import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

// --- IMPORT DTO ---
import { CreateRescueRequestDto } from './dto/create-rescue-request.dto';
import { QueryRescueRequestDto } from './dto/query-rescue-request.dto';
import { UpdateStatusDto, RequestStatus } from './dto/update-status.dto';
import { AssignRequestDto } from './dto/assign-request.dto';
import { CancelRescueRequestDto } from './dto/cancel-request.dto';

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

  // 🚀 BIẾN DÙNG CHUNG: Nested Populate thần thánh giúp code gọn gàng
  private readonly fullPopulateOptions = [
    { path: 'userId', select: 'fullName phone' },
    {
      path: 'assignedTeamId',
      select: 'teamName status vehicles',
      populate: { path: 'vehicles', model: 'Vehicle', select: 'name plateNumber type capacity' }
    },
    {
      path: 'allocatedSupplies.inventoryId',
      model: 'Inventory',
      select: 'itemName unit'
    }
  ];

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
      .populate(this.fullPopulateOptions) // 👈 Áp dụng Nested Populate
      .sort({ createdAt: -1 })
      .exec();
  }

  // =========================================================================
  // 2. CÁC HÀM LUỒNG NGHIỆP VỤ CỐT LÕI
  // =========================================================================

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

  // [COORDINATOR] Phân công Đội, Xe và Vật tư
  async assignTeam(id: string, assignDto: AssignRequestDto) {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('Định dạng ID không hợp lệ');

    const request = await this.rescueRequestModel.findById(id);
    if (!request) throw new NotFoundException('Không tìm thấy yêu cầu cứu hộ này');
    if (request.status !== 'PENDING' && request.status !== 'VERIFIED') {
      throw new BadRequestException('Đơn này đã được xử lý hoặc đã hoàn thành!');
    }

    const team = await this.rescueTeamModel.findById(assignDto.teamId);
    if (!team) throw new NotFoundException('Không tìm thấy Đội cứu hộ');

    // 1. Xử lý xe cộ (Gán xe vào Đội)
    if (assignDto.vehicleId) {
      const vehicle = await this.vehicleModel.findById(assignDto.vehicleId);
      if (!vehicle) throw new NotFoundException('Không tìm thấy phương tiện');

      // Update xe
      await this.vehicleModel.findByIdAndUpdate(assignDto.vehicleId, {
        status: 'IN_USE', assignedTeamId: assignDto.teamId
      });
      // Bổ sung xe vào mảng vehicles của Đội
      await this.rescueTeamModel.findByIdAndUpdate(assignDto.teamId, {
        status: 'BUSY',
        $addToSet: { vehicles: assignDto.vehicleId }
      });
    } else {
      await this.rescueTeamModel.findByIdAndUpdate(assignDto.teamId, { status: 'BUSY' });
    }

    // 2. Xử lý trừ kho Vật tư
    if (assignDto.supplies && assignDto.supplies.length > 0) {
      for (const item of assignDto.supplies) {
        const inventory = await this.inventoryModel.findById(item.inventoryId);
        if (!inventory) throw new NotFoundException(`Không tìm thấy vật tư ID: ${item.inventoryId}`);
        if (inventory.quantity < item.quantity) {
          throw new BadRequestException(`Kho không đủ! ${inventory.itemName || 'Vật tư này'} chỉ còn ${inventory.quantity}`);
        }
        await this.inventoryModel.findByIdAndUpdate(item.inventoryId, {
          $inc: { quantity: -item.quantity }
        });
      }
    }

    // 3. Cập nhật Ca cứu hộ
    const updatedRequest = await this.rescueRequestModel.findByIdAndUpdate(
      id,
      {
        assignedTeamId: assignDto.teamId,
        allocatedSupplies: assignDto.supplies, // 👈 Lưu vào đúng trường đã tạo ở Schema
        status: 'ASSIGNED'
      },
      { returnDocument: 'after' }
    )
      .populate(this.fullPopulateOptions) // 👈 Áp dụng Nested Populate
      .exec();

    return {
      message: 'Điều phối cứu hộ thành công!',
      data: updatedRequest
    };
  }

  async updateStatus(id: string, updateStatusDto: UpdateStatusDto) {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('Định dạng ID không hợp lệ');

    const updateData: any = { status: updateStatusDto.status };

    if (updateStatusDto.status === RequestStatus.COMPLETED) {
      updateData.evidenceImage = updateStatusDto.evidenceImage;
      updateData.completedAt = new Date();
      // Bonus: Logic giải phóng Đội và Xe về trạng thái AVAILABLE có thể thêm ở đây
    }

    if (updateStatusDto.status === RequestStatus.CANCELLED) {
      updateData.cancelReason = updateStatusDto.cancelReason;
    }

    const updatedRequest = await this.rescueRequestModel
      .findByIdAndUpdate(id, { $set: updateData }, { returnDocument: 'after' })
      .exec();

    if (!updatedRequest) throw new NotFoundException('Không tìm thấy yêu cầu cứu hộ này');
    return updatedRequest;
  }

  async confirmRescued(id: string, userId: string) {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('Định dạng ID không hợp lệ');

    const request = await this.rescueRequestModel.findOne({ _id: id, userId: userId });

    if (!request) {
      throw new NotFoundException('Không tìm thấy đơn hoặc bạn không có quyền xác nhận đơn này');
    }

    request.status = 'COMPLETED';
    request.completedAt = new Date();
    return request.save();
  }

  async cancel(id: string, userId: string, userRole: string, cancelDto: CancelRescueRequestDto) {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('ID không hợp lệ');

    const filter: any = {
      _id: id,
      status: 'PENDING'
    };

    if (userRole === 'CITIZEN') {
      filter.userId = userId;
    }

    const canceledRequest = await this.rescueRequestModel.findOneAndUpdate(
      filter,
      {
        $set: {
          status: 'CANCELLED',
          cancelReason: cancelDto.cancelReason,
        }
      },
      { new: true }
    );

    if (!canceledRequest) {
      throw new BadRequestException(
        'Không thể hủy yêu cầu! Yêu cầu không tồn tại, bạn không có quyền, hoặc Đội cứu hộ đã xuất phát.'
      );
    }

    return { message: 'Đã hủy yêu cầu cứu hộ thành công', data: canceledRequest };
  }

  // =========================================================================
  // 3. CÁC HÀM TRUY VẤN CHI TIẾT
  // =========================================================================

  async findOne(id: string) {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('Định dạng ID không hợp lệ');

    const request = await this.rescueRequestModel
      .findById(id)
      .populate(this.fullPopulateOptions) // 👈 Áp dụng Nested Populate
      .exec();

    if (!request) throw new NotFoundException('Không tìm thấy yêu cầu cứu hộ');
    return request;
  }

  async findMyRequests(userId: string) {
    return this.rescueRequestModel
      .find({ userId: userId })
      .populate(this.fullPopulateOptions) // 👈 Áp dụng Nested Populate
      .sort({ createdAt: -1 })
      .exec();
  }

  async findAssignedTasks(teamId: string) {
    return this.rescueRequestModel
      .find({ assignedTeamId: teamId })
      .sort({ createdAt: -1 })
      .populate(this.fullPopulateOptions) // 👈 Áp dụng Nested Populate
      .exec();
  }
}