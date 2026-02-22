import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateRescueRequestDto } from './dto/create-rescue-request.dto';
import { QueryRescueRequestDto } from './dto/query-rescue-request.dto';
import { RescueRequest } from './schemas/rescue-request.schema';
import { UpdateStatusDto } from './dto/update-status.dto';
import { AssignTeamDto } from './dto/assign-team.dto';
import { CountersService } from '../counters/schemas/counter.service';

@Injectable()
export class RescueRequestsService {
  constructor(
    @InjectModel(RescueRequest.name) private rescueRequestModel: Model<RescueRequest>,
    private counterService: CountersService,
  ) { }

  // --- CÁC HÀM CƠ BẢN ---

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
      .populate('assignedTeamId', 'teamName vehicleType')
      .sort({ createdAt: -1 })
      .exec();
  }

  async updateStatus(id: string, updateStatusDto: UpdateStatusDto) {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('Định dạng ID không hợp lệ');

    const updatedRequest = await this.rescueRequestModel
      .findByIdAndUpdate(id, { status: updateStatusDto.status }, { returnDocument: 'after' })
      .exec();
    if (!updatedRequest) throw new NotFoundException('Không tìm thấy yêu cầu cứu hộ này');
    return updatedRequest;
  }

  async assignTeam(id: string, assignTeamDto: AssignTeamDto) {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('Định dạng ID không hợp lệ');

    const updatedRequest = await this.rescueRequestModel
      .findByIdAndUpdate(
        id,
        { assignedTeamId: assignTeamDto.teamId, status: 'IN_PROGRESS' },
        { returnDocument: 'after' }
      )
      .populate('assignedTeamId')
      .exec();
    if (!updatedRequest) throw new NotFoundException('Không tìm thấy yêu cầu cứu hộ này');
    return updatedRequest;
  }

  // =========================================================================
  // 👇 CÁC HÀM LUỒNG NGHIỆP VỤ (Đã vá lỗi TypeScript & ID) 👇
  // =========================================================================

  // 1. LẤY CHI TIẾT 1 ĐƠN (Dành cho mọi Role xem chi tiết)
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

  // 2. LẤY LỊCH SỬ ĐƠN CỦA TÔI (Dành cho Citizen xem lại đơn mình đã gửi)
  async findMyRequests(userId: string) {
    return this.rescueRequestModel
      .find({ userId } as any) // 👈 Đã bọc as any ra ngoài
      .sort({ createdAt: -1 })
      .exec();
  }

  // 3. LẤY NHIỆM VỤ ĐƯỢC GIAO (Dành cho Rescue Team xem ca của mình)
  async findAssignedTasks(teamId: string) {
    return this.rescueRequestModel
      .find({ assignedTeamId: teamId } as any) // 👈 Đã bọc as any ra ngoài
      .sort({ createdAt: -1 })
      .populate('userId', 'fullName phone location description images')
      .exec();
  }

  // 4. XÁC MINH VÀ PHÂN LOẠI (Dành cho Coordinator duyệt đơn)
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

  // 5. CÔNG DÂN XÁC NHẬN ĐÃ AN TOÀN
  async confirmRescued(id: string, userId: string) {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('Định dạng ID không hợp lệ');

    const request = await this.rescueRequestModel.findOne({ _id: id, userId } as any);

    if (!request) {
      throw new NotFoundException('Không tìm thấy đơn hoặc bạn không có quyền xác nhận đơn này');
    }

    request.status = 'COMPLETED';
    return request.save();
  }
}