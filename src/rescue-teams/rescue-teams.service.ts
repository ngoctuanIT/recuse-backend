import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Types, Connection } from 'mongoose';

// Schemas
import { RescueTeam, RescueTeamDocument } from './schemas/rescue-team.schema';
import { User } from '../users/schemas/user.schema';
import { Vehicle } from '../vehicles/schemas/vehicle.schema'; // 👈 BẮT BUỘC IMPORT BẢNG XE

// DTOs & Enums
import { CreateRescueTeamDto } from './dto/create-rescue-team.dto';
import { UpdateRescueTeamDto } from './dto/update-rescue-team.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { UpdateTeamStatusDto } from './dto/update-team-status.dto'; // Import DTO status
import { TeamStatus } from './enums/team-status.enum'; // Import Enum

@Injectable()
export class RescueTeamsService {
  constructor(
    @InjectModel(RescueTeam.name) private rescueTeamModel: Model<RescueTeamDocument>,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Vehicle.name) private vehicleModel: Model<Vehicle>, // Inject model Xe
    @InjectConnection() private connection: Connection // Kéo Connection để làm Transaction
  ) { }

  // =========================================================================
  // 1. CORE CRUD (Tạo, Sửa, Đọc) - Đã bọc thêm cờ isActive: true
  // =========================================================================

  async create(createDto: CreateRescueTeamDto) {
    const leader = await this.userModel.findById(createDto.leaderId);
    if (!leader) throw new BadRequestException('ID Đội trưởng không tồn tại!');

    const existingTeam = await this.rescueTeamModel.findOne({ teamName: createDto.teamName });
    if (existingTeam) throw new ConflictException('Tên đội này đã tồn tại!');

    // 🛡️ Bóc tách tọa độ ra khỏi DTO
    const { latitude, longitude, ...restDto } = createDto;

    const newTeam = new this.rescueTeamModel({
      ...restDto, // Chỉ nạp các trường còn lại (teamName, leaderId,...)
      members: [createDto.leaderId],
      vehicles: [],
      status: TeamStatus.AVAILABLE,
      isActive: true, // Khởi tạo cờ xóa mềm
      // 👇 Nạp tọa độ vào chuẩn GeoJSON của Mongoose
      currentLocation: {
        type: 'Point',
        coordinates: [longitude, latitude] // Lưu ý: MongoDB yêu cầu [Kinh độ, Vĩ độ]
      }
    });

    return await newTeam.save();
  }

  async findAll() {
    return this.rescueTeamModel
      .find({ isActive: true }) // 🛡️ Chỉ lấy đội đang hoạt động
      .populate('leaderId', 'fullName phone role')
      .populate('members', 'fullName phone role')
      .populate('vehicles')
      .exec();
  }

  async findOne(id: string) {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('ID không hợp lệ');

    const team = await this.rescueTeamModel
      .findOne({ _id: id, isActive: true })
      .populate('leaderId', 'fullName phone role')
      .populate('members', 'fullName phone role')
      .populate('vehicles')
      .exec();

    if (!team) throw new NotFoundException('Không tìm thấy đội cứu hộ');
    return team;
  }

  async update(id: string, updateDto: UpdateRescueTeamDto) {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('ID không hợp lệ');

    const safeUpdateData = { ...updateDto };
    delete safeUpdateData['members'];
    delete safeUpdateData['vehicles'];
    delete safeUpdateData['status']; // 🛡️ Chặn không cho update status ở đây

    const updatedTeam = await this.rescueTeamModel.findOneAndUpdate(
      { _id: id, isActive: true },
      { $set: safeUpdateData },
      { new: true }
    )
      .populate('leaderId', 'fullName phone')
      .exec();

    if (!updatedTeam) throw new NotFoundException('Không tìm thấy đội cứu hộ');
    return updatedTeam;
  }

  // =========================================================================
  // 2. NGHIỆP VỤ STATUS & GPS
  // =========================================================================

  async updateLocation(id: string, updateLocationDto: UpdateLocationDto) {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('ID không hợp lệ');

    const updatedTeam = await this.rescueTeamModel.findOneAndUpdate(
      { _id: id, isActive: true },
      {
        $set: {
          currentLocation: {
            type: 'Point',
            coordinates: [updateLocationDto.longitude, updateLocationDto.latitude]
          }
        }
      },
      { new: true }
    );

    if (!updatedTeam) throw new NotFoundException('Không tìm thấy đội');
    return updatedTeam;
  }

  async updateStatus(id: string, updateStatusDto: UpdateTeamStatusDto, userRole: string) {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('ID không hợp lệ');

    const team = await this.rescueTeamModel.findOne({ _id: id, isActive: true });
    if (!team) throw new NotFoundException('Không tìm thấy đội cứu hộ');

    const { status: newStatus } = updateStatusDto;

    // 🛡️ CHỐT CHẶN: Đang cứu người thì không được tự ý đi ngủ
    if (team.status === TeamStatus.BUSY && newStatus !== TeamStatus.BUSY) {
      if (userRole !== 'ADMIN' && userRole !== 'COORDINATOR' && userRole !== 'MANAGER') {
        throw new ConflictException('Đội đang thực hiện nhiệm vụ (BUSY)! Yêu cầu hoàn thành nhiệm vụ trước.');
      }
    }

    team.status = newStatus;
    return await team.save();
  }

  // =========================================================================
  // 3. NGHIỆP VỤ NHÂN SỰ
  // =========================================================================

  async addMember(teamId: string, userId: string) {
    if (!Types.ObjectId.isValid(teamId) || !Types.ObjectId.isValid(userId)) throw new BadRequestException('ID không hợp lệ');

    const team = await this.rescueTeamModel.findOneAndUpdate(
      { _id: teamId, isActive: true },
      { $addToSet: { members: userId } },
      { new: true }
    ).populate('members', 'fullName phone role');

    if (!team) throw new NotFoundException('Không tìm thấy đội');
    return team;
  }

  async removeMember(teamId: string, userId: string) {
    if (!Types.ObjectId.isValid(teamId) || !Types.ObjectId.isValid(userId)) throw new BadRequestException('ID không hợp lệ');

    const team = await this.rescueTeamModel.findOne({ _id: teamId, isActive: true });
    if (!team) throw new NotFoundException('Không tìm thấy đội');

    // 🛡️ Bắt lỗi: Không cho phép xóa Đội trưởng
    if (team.leaderId.toString() === userId) {
      throw new ConflictException('Không thể xóa Đội trưởng ra khỏi đội! Hãy thay đổi Đội trưởng trước.');
    }

    team.members = team.members.filter(id => id.toString() !== userId);
    return await team.save();
  }

  // =========================================================================
  // 4. NGHIỆP VỤ PHƯƠNG TIỆN (BỌC TRANSACTION - CHỐT CHẶN RACE CONDITION)
  // =========================================================================

  async addVehicle(teamId: string, vehicleId: string) {
    if (!Types.ObjectId.isValid(teamId) || !Types.ObjectId.isValid(vehicleId)) throw new BadRequestException('ID không hợp lệ');

    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      // 1. Kiểm tra xe có RẢNH không, và đổi trạng thái xe
      const vehicle = await this.vehicleModel.findOneAndUpdate(
        { _id: vehicleId, status: 'AVAILABLE', isActive: true },
        { $set: { status: 'IN_USE', assignedTeamId: teamId } },
        { session, new: true }
      );

      if (!vehicle) throw new BadRequestException('Phương tiện không tồn tại, bị hỏng, hoặc đã bị đội khác lấy!');

      // 2. Nhét xe vào túi của Đội
      const team = await this.rescueTeamModel.findOneAndUpdate(
        { _id: teamId, isActive: true },
        { $addToSet: { vehicles: vehicleId } },
        { session, new: true }
      ).populate('vehicles');

      if (!team) throw new NotFoundException('Không tìm thấy đội');

      await session.commitTransaction();
      return team;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async removeVehicle(teamId: string, vehicleId: string) {
    if (!Types.ObjectId.isValid(teamId) || !Types.ObjectId.isValid(vehicleId)) throw new BadRequestException('ID không hợp lệ');

    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      // 1. Trả xe về kho
      const vehicle = await this.vehicleModel.findOneAndUpdate(
        { _id: vehicleId, assignedTeamId: teamId }, // Bắt buộc xe này phải thuộc về đội này
        { $set: { status: 'AVAILABLE', assignedTeamId: null } },
        { session, new: true }
      );

      if (!vehicle) throw new BadRequestException('Phương tiện không thuộc quyền quản lý của đội này!');

      // 2. Xóa xe khỏi túi của đội
      const team = await this.rescueTeamModel.findOneAndUpdate(
        { _id: teamId, isActive: true },
        { $pull: { vehicles: vehicleId } },
        { session, new: true }
      ).populate('vehicles');

      await session.commitTransaction();
      return team;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  // =========================================================================
  // 5. GIẢI TÁN ĐỘI (SOFT DELETE + CASCADING VỀ KHO)
  // =========================================================================

  async remove(id: string) {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('ID không hợp lệ');

    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      const team = await this.rescueTeamModel.findOne({ _id: id, isActive: true }).session(session);
      if (!team) throw new NotFoundException('Không tìm thấy đội');

      if (team.status === TeamStatus.BUSY) {
        throw new ConflictException('Không thể giải tán Đội đang trong trạng thái BUSY!');
      }

      // Trả toàn bộ xe về kho
      if (team.vehicles && team.vehicles.length > 0) {
        await this.vehicleModel.updateMany(
          { _id: { $in: team.vehicles } },
          { $set: { status: 'AVAILABLE', assignedTeamId: null } },
          { session }
        );
      }

      // Xóa mềm đội
      team.isActive = false;
      team.status = TeamStatus.OFFLINE;
      team.vehicles = [];
      await team.save({ session });

      await session.commitTransaction();
      return { message: 'Đã giải tán đội và thu hồi phương tiện thành công.' };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
  async findAvailable() {
    return this.rescueTeamModel
      .find({
        status: TeamStatus.AVAILABLE,
        isActive: true
      })
      .populate('leaderId', 'fullName phone role')
      .populate('members', 'fullName phone role')
      .populate('vehicles')
      .exec();
  }
}