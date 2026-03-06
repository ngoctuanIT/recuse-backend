import { Injectable, NotFoundException, BadRequestException, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from './schemas/user.schema';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { Role } from 'src/auth/enums/role.enum';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) { }

  // 1. Lưu User mới vào Database
  async create(userData: Partial<User>): Promise<UserDocument> {
    // 1. Tạo instance mới của Model
    const newUser = new this.userModel({
      ...userData,      // Trải toàn bộ dữ liệu hợp lệ từ DTO ra
      role: Role.CITIZEN,    // 👈 ĐIỂM CHỐT HẠ: Ép cứng Role là CITIZEN
    });

    // 2. Lưu vào Database
    // 👇 Bao bọc việc lưu Database bằng try...catch
    try {
      // Nhớ thêm chữ 'await' ở đây để catch có thể bắt được lỗi Promise
      const savedUser = await newUser.save();
      return savedUser;

    } catch (error) {
      // 🕵️‍♂️ BẮT LỖI 11000 CỦA MONGODB
      if (error.code === 11000) {
        // Lấy ra cái key bị trùng (có thể là username hoặc phone) để báo lỗi cho chuẩn
        const duplicateField = Object.keys(error.keyPattern)[0];

        throw new ConflictException(`${duplicateField} này đã tồn tại trên hệ thống! Vui lòng chọn cái khác.`);
      }

      // Nếu là lỗi khác (rớt mạng, DB sập...) thì mới ném lỗi 500
      throw new InternalServerErrorException('Lỗi hệ thống khi tạo tài khoản');
    }
  }

  // 2. Tìm User theo SỐ ĐIỆN THOẠI (Dùng cho Login và Check trùng lặp)
  async findByPhone(phone: string): Promise<UserDocument | null> {
    // Chỉ tìm những tài khoản chưa bị xóa (isActive: true)
    return this.userModel.findOne({ phone, isActive: true }).exec();
  }

  // 3. Tìm User theo ID (Dùng để xem Profile)
  async findById(id: string): Promise<UserDocument> {
    const user = await this.userModel
      .findOne({ _id: id, isActive: true }) // Kèm điều kiện chưa bị xóa
      .select('-password')
      .exec();

    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng hoặc tài khoản đã bị khóa');
    }
    return user;
  }

  // 4. Lấy danh sách tất cả User (Dành cho Admin quản lý)
  async findAll(): Promise<UserDocument[]> {
    return this.userModel
      .find({ isActive: true }) // Bỏ qua những người đã bị xóa
      .select('-password')
      .sort({ createdAt: -1 })
      .exec();
  }

  // 5. Cập nhật thông tin cá nhân
  async update(id: string, updateUserDto: UpdateUserDto): Promise<UserDocument> {
    // 1. Kiểm tra định dạng ID trước khi chạm vào DB
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Định dạng ID người dùng không hợp lệ');
    }

    // 2. Blacklist: Chặn các trường không được phép sửa đổi (Data Sanitization)
    const sensitiveFields = ['password', 'role', 'userCode', 'isActive', 'username'];
    sensitiveFields.forEach(field => delete updateUserDto[field]);

    // 3. Thực hiện Update với cơ chế bảo vệ
    try {
      const updatedUser = await this.userModel
        .findOneAndUpdate(
          { _id: id, isActive: true },
          { $set: updateUserDto }, // 👈 Dùng $set để chỉ cập nhật những gì được gửi lên
          {
            new: true,               // Trả về bản ghi SAU KHI sửa
            runValidators: true,     // Buộc Mongoose chạy lại các Rule Validate trong Schema
            context: 'query'
          }
        )
        .select('-password') // Giấu pass
        .exec();

      // 4. Kiểm tra sự tồn tại
      if (!updatedUser) {
        throw new NotFoundException('Không tìm thấy người dùng hoặc tài khoản đã bị khóa');
      }

      return updatedUser;

    } catch (error) {
      // 5. Xử lý lỗi trùng lặp (ví dụ đổi SĐT trùng với người khác)
      if (error.code === 11000) {
        const field = Object.keys(error.keyPattern)[0];
        throw new ConflictException(`${field} này đã tồn tại trên hệ thống!`);
      }

      // Lỗi hệ thống khác
      throw new InternalServerErrorException('Có lỗi xảy ra trong quá trình cập nhật');
    }
  }

  // 6. Logic đổi mật khẩu riêng biệt
  async changePassword(id: string, changePasswordDto: ChangePasswordDto) {
    const user = await this.userModel.findOne({ _id: id, isActive: true });
    if (!user) throw new NotFoundException('Người dùng không tồn tại hoặc đã bị khóa');

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

  // 7. Xóa người dùng (XÓA MỀM - Soft Delete)
  async remove(id: string) {
    // Thay vì xóa hẳn (findByIdAndDelete), ta cập nhật isActive thành false
    const result = await this.userModel
      .findByIdAndUpdate(id, { isActive: false }, { new: true })
      .exec();

    if (!result) throw new NotFoundException('Người dùng không tồn tại để xóa');
    return { message: 'Đã vô hiệu hóa (xóa mềm) người dùng thành công' };
  }
  // 8. Cấp quyền (Đổi Role) - Dành riêng cho Admin
  async changeRole(id: string, newRole: string) {
    const updatedUser = await this.userModel
      .findByIdAndUpdate(
        id,
        { role: newRole },
        { new: true }
      )
      .select('-password')
      .exec();

    if (!updatedUser) throw new NotFoundException('Người dùng không tồn tại');
    return updatedUser;
  }
}