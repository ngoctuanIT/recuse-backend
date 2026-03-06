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
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';

// 👇 1. Import các vũ khí phân quyền & DTO mới
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Role } from '../auth/enums/role.enum';
import { ChangeRoleDto } from './dto/change-role.dto';

@ApiTags('Users Management')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt')) // Xác thực vé (Token) cho toàn bộ API
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  // ====================================================================
  // 1. NHÓM API DÀNH CHO NGƯỜI DÙNG TỰ QUẢN LÝ (ME)
  // ====================================================================

  @Get('profile')
  @ApiOperation({ summary: 'Xem hồ sơ của chính mình (Lấy từ Database)' })
  getProfile(@Request() req) {
    // console.log('Dữ liệu trong Token:', req.user);
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

  // ====================================================================
  // 2. NHÓM API DÀNH CHO QUẢN TRỊ (ADMIN) - Đã khóa cửa RolesGuard
  // ====================================================================

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN) // 👈 Chỉ Admin mới được lấy danh sách
  @Get()
  @ApiOperation({ summary: '[Admin] Lấy danh sách tất cả người dùng (Đang hoạt động)' })
  findAll() {
    return this.usersService.findAll();
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN) // 👈 Chỉ Admin mới được tìm bằng SĐT người khác
  @Get(':phone')
  @ApiOperation({ summary: '[Admin] Tìm chi tiết người dùng qua Số điện thoại' })
  @ApiParam({ name: 'phone', example: '0987654321' })
  findByPhone(@Param('phone') phone: string) {
    return this.usersService.findByPhone(phone);
  }

  // 👇 THÊM MỚI: API Phong tước / Cấp quyền
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN) // 👈 Chỉ Admin tối cao mới được quyền đổi Role
  @Patch(':id/role')
  @ApiOperation({ summary: '[Admin] Cấp quyền (đổi Role) cho người dùng' })
  @ApiParam({ name: 'id', description: 'ID của user cần cấp quyền' })
  changeRole(
    @Param('id') id: string,
    @Body() changeRoleDto: ChangeRoleDto
  ) {
    return this.usersService.changeRole(id, changeRoleDto.role);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN) // 👈 Chỉ Admin mới được quyền xóa/khóa tài khoản
  @Delete(':id')
  @ApiOperation({ summary: '[Admin] Vô hiệu hóa (Xóa mềm) một người dùng' })
  @ApiParam({ name: 'id', description: 'ID của user trong MongoDB' })
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}