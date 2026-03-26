import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

// --- IMPORT DTO ---
import { CreateRescueRequestDto } from './dto/create-rescue-request.dto';
import { QueryRescueRequestDto } from './dto/query-rescue-request.dto';
import { UpdateStatusDto, RequestStatus } from './dto/update-status.dto'; // Cập nhật import RequestStatus
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
        coordinates: [createDto.longitude, createDto.latitude], // [Kinh độ, Vĩ độ]
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

    const request = await this.rescueRequestModel.findById(id);
    if (!request) throw new NotFoundException('Không tìm thấy yêu cầu cứu hộ này');
    if (request.status !== 'PENDING' && request.status !== 'VERIFIED') {
      throw new BadRequestException('Đơn này đã được xử lý hoặc đã hoàn thành!');
    }

    const team = await this.rescueTeamModel.findById(assignDto.teamId);
    if (!team) throw new NotFoundException('Không tìm thấy Đội cứu hộ');

    if (assignDto.vehicleId) {
      const vehicle = await this.vehicleModel.findById(assignDto.vehicleId);
      if (!vehicle) throw new NotFoundException('Không tìm thấy phương tiện');
      await this.vehicleModel.findByIdAndUpdate(assignDto.vehicleId, { status: 'IN_USE' });
    }

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

    await this.rescueTeamModel.findByIdAndUpdate(assignDto.teamId, { status: 'BUSY' });

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

    const updateData: any = { status: updateStatusDto.status };

    // 🛡️ CHỐT CHẶN SENIOR: Xử lý logic theo từng trạng thái cụ thể
    if (updateStatusDto.status === RequestStatus.COMPLETED) {
      updateData.evidenceImage = updateStatusDto.evidenceImage; // Lưu ảnh chứng thực
      updateData.completedAt = new Date(); // Chốt giờ hoàn thành

      // Bonus: Ở thực tế, chỗ này có thể thêm code để tự động set trạng thái Đội Cứu Hộ từ BUSY về AVAILABLE
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

  // [CITIZEN] Xác nhận đã an toàn (Đóng đơn)
  async confirmRescued(id: string, userId: string) {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('Định dạng ID không hợp lệ');

    // Chú ý: Đã đổi citizenId thành userId cho khớp với Schema của bạn
    const request = await this.rescueRequestModel.findOne({ _id: id, userId: userId });

    if (!request) {
      throw new NotFoundException('Không tìm thấy đơn hoặc bạn không có quyền xác nhận đơn này');
    }

    request.status = 'COMPLETED';
    request.completedAt = new Date(); // Đóng mộc thời gian lúc nạn nhân báo an toàn
    return request.save();
  }

  // [CITIZEN/ADMIN] Hủy đơn cứu hộ (Khi chưa có đội tiếp cận)
  async cancel(id: string, userId: string, userRole: string, cancelDto: CancelRescueRequestDto) {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('ID không hợp lệ');

    // 1. Build bộ lọc an toàn
    const filter: any = {
      _id: id,
      status: 'PENDING' // Chặn cứng: Chỉ cho phép hủy khi đang PENDING
    };

    // Nếu là Citizen, ép buộc phải đúng chủ nhân mới được hủy. Đổi citizenId thành userId
    if (userRole === 'CITIZEN') {
      filter.userId = userId;
    }

    // 2. Thực thi Atomic Update
    const canceledRequest = await this.rescueRequestModel.findOneAndUpdate(
      filter,
      {
        $set: {
          status: 'CANCELLED', // Lưu ý: Sửa 'CANCELED' thành 'CANCELLED' cho khớp với Enum
          cancelReason: cancelDto.cancelReason,
          // Bỏ canceledAt vì dùng createdAt/updatedAt là đủ tracking, hoặc bạn có thể thêm lại nếu muốn
        }
      },
      { new: true }
    );

    // 3. Bắt lỗi logic
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
      .populate('userId', 'fullName phone')
      .populate('assignedTeamId')
      .exec();

    if (!request) throw new NotFoundException('Không tìm thấy yêu cầu cứu hộ');
    return request;
  }

  async findMyRequests(userId: string) {
    return this.rescueRequestModel
      .find({ userId: userId })
      .sort({ createdAt: -1 })
      .exec();
  }

  async findAssignedTasks(teamId: string) {
    return this.rescueRequestModel
      .find({ assignedTeamId: teamId })
      .sort({ createdAt: -1 })
      .populate('userId', 'fullName phone location description images')
      .exec();
  }
}