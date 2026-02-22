import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { RescueTeam } from './schemas/rescue-team.schema';
import { CreateRescueTeamDto } from './dto/create-rescue-team.dto';
import { UpdateRescueTeamDto } from './dto/update-rescue-team.dto';
import { UpdateLocationDto } from './dto/update-location.dto'

@Injectable()
export class RescueTeamsService {
  constructor(
    @InjectModel(RescueTeam.name) private rescueTeamModel: Model<RescueTeam>,
  ) { }

  // 1. Tạo đội mới
  async create(createDto: CreateRescueTeamDto) {
    try {
      const newTeam = new this.rescueTeamModel(createDto);
      return await newTeam.save();
    } catch (error) {
      if (error.code === 11000) {
        throw new BadRequestException('Tên đội này đã tồn tại!');
      }
      throw error;
    }
  }

  // 2. Lấy danh sách tất cả các đội (Kèm thông tin Đội trưởng, Thành viên và Phương tiện)
  async findAll() {
    return this.rescueTeamModel
      .find()
      .populate('leaderId', 'fullName phone')
      .populate('members', 'fullName phone')
      .populate('vehicles') // 👈 Rất quan trọng: Kéo thông tin chiếc xuồng ra
      .exec();
  }

  // 3. Lấy chi tiết 1 đội
  async findOne(id: string) {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('ID không hợp lệ');
    const team = await this.rescueTeamModel
      .findById(id)
      .populate('leaderId', 'fullName phone')
      .populate('members', 'fullName phone')
      .populate('vehicles')
      .exec();
    if (!team) throw new NotFoundException('Không tìm thấy đội cứu hộ');
    return team;
  }

  // 👇 4. HÀM MỚI: Cập nhật thông tin đội (Thêm xe, đổi trạng thái...)
  async update(id: string, updateDto: UpdateRescueTeamDto) {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('ID không hợp lệ');

    const updatedTeam = await this.rescueTeamModel.findByIdAndUpdate(
      id,
      updateDto, // Truyền thẳng DTO vào vì các trường đều là tuỳ chọn (Optional)
      { new: true }
    )
      .populate('leaderId', 'fullName phone')
      .populate('vehicles')
      .exec();

    if (!updatedTeam) throw new NotFoundException('Không tìm thấy đội cứu hộ');
    return updatedTeam;
  }

  // 5. Cập nhật vị trí GPS liên tục của đội
  async updateLocation(id: string, updateLocationDto: UpdateLocationDto) {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('ID không hợp lệ');

    const updatedTeam = await this.rescueTeamModel.findByIdAndUpdate(
      id,
      {
        currentLocation: {
          type: 'Point',
          coordinates: [updateLocationDto.longitude, updateLocationDto.latitude]
        }
      },
      { new: true }
    );
    if (!updatedTeam) throw new NotFoundException('Không tìm thấy đội cứu hộ');
    return updatedTeam;
  }
}