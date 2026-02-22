import {
  Controller,
  Get,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { AuthGuard } from '@nestjs/passport'; // Đảm bảo Guard này đã được cấu hình
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';

@ApiTags('Users Management')
@ApiBearerAuth() // Hiện nút khóa (Authorize) trên Swagger
@UseGuards(AuthGuard('jwt')) // Bảo vệ toàn bộ API trong Controller này bằng JWT
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  // --- 1. NHÓM API DÀNH CHO NGƯỜI DÙNG TỰ QUẢN LÝ (ME) ---

  @Get('profile')
  @ApiOperation({ summary: 'Xem hồ sơ của chính mình (Lấy từ Database)' })
  getProfile(@Request() req) {
    // req.user.sub được JwtStrategy trích xuất từ Token
    return this.usersService.findById(req.user.sub);
  }

  @Patch('profile')
  @ApiOperation({ summary: 'Cập nhật thông tin cá nhân (Tên, SĐT...)' })
  updateProfile(@Request() req, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(req.user.sub, updateUserDto);
  }

  @Patch('change-password')
  @ApiOperation({ summary: 'Đổi mật khẩu tài khoản' })
  changePassword(@Request() req, @Body() changePasswordDto: ChangePasswordDto) {
    return this.usersService.changePassword(req.user.sub, changePasswordDto);
  }

  // --- 2. NHÓM API DÀNH CHO QUẢN TRỊ (ADMIN) ---

  @Get()
  @ApiOperation({ summary: '[Admin] Lấy danh sách tất cả người dùng' })
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':username')
  @ApiOperation({ summary: '[Admin] Tìm chi tiết người dùng qua Username' })
  @ApiParam({ name: 'username', example: 'admin123' })
  findOne(@Param('username') username: string) {
    return this.usersService.findOne(username);
  }

  @Delete(':id')
  @ApiOperation({ summary: '[Admin] Xóa vĩnh viễn một người dùng' })
  @ApiParam({ name: 'id', description: 'ID của user trong MongoDB' })
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}