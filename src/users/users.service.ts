import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from './schemas/user.schema';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) { }

  // 1. Lưu User mới vào Database (Được gọi từ AuthService)
  async create(userRawData: any): Promise<UserDocument> {
    const newUser = new this.userModel(userRawData);
    return newUser.save();
  }

  // 2. Tìm User theo Username (Dùng để kiểm tra trùng lặp hoặc Login)
  async findOne(username: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ username }).exec();
  }

  // 3. Tìm User theo ID (Dùng để xem Profile hoặc update)
  async findById(id: string): Promise<UserDocument> {
    const user = await this.userModel.findById(id).select('-password').exec();
    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }
    return user;
  }

  // 4. Lấy danh sách tất cả User (Dành cho Admin)
  async findAll(): Promise<UserDocument[]> {
    return this.userModel.find().select('-password').sort({ createdAt: -1 }).exec();
  }

  // 5. Cập nhật thông tin cá nhân (Tên, SĐT, ...)
  async update(id: string, updateUserDto: UpdateUserDto): Promise<UserDocument> {
    // Chặn không cho cập nhật các trường nhạy cảm qua hàm này
    delete updateUserDto['password'];
    delete updateUserDto['role'];
    delete updateUserDto['userCode'];

    const updatedUser = await this.userModel
      .findByIdAndUpdate(id, updateUserDto, { new: true })
      .select('-password')
      .exec();

    if (!updatedUser) throw new NotFoundException('Người dùng không tồn tại');
    return updatedUser;
  }

  // 6. Logic đổi mật khẩu riêng biệt
  async changePassword(id: string, changePasswordDto: ChangePasswordDto) {
    const user = await this.userModel.findById(id);
    if (!user) throw new NotFoundException('Người dùng không tồn tại');

    // So sánh pass cũ
    const isMatch = await bcrypt.compare(changePasswordDto.oldPassword, user.password);
    if (!isMatch) {
      throw new BadRequestException('Mật khẩu cũ không chính xác');
    }

    // Hash pass mới và lưu
    const salt = await bcrypt.genSalt();
    user.password = await bcrypt.hash(changePasswordDto.newPassword, salt);

    return user.save();
  }

  // 7. Xóa người dùng (Admin)
  async remove(id: string) {
    const result = await this.userModel.findByIdAndDelete(id).exec();
    if (!result) throw new NotFoundException('Người dùng không tồn tại để xóa');
    return { message: 'Xóa người dùng thành công' };
  }
}