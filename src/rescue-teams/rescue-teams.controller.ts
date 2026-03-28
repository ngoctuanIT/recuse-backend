import {
  Controller, Get, Post, Body, Patch, Param, Delete,
  UseGuards, ValidationPipe, UsePipes, Req
} from '@nestjs/common';
import { RescueTeamsService } from './rescue-teams.service';
import { CreateRescueTeamDto } from './dto/create-rescue-team.dto';
import { UpdateRescueTeamDto } from './dto/update-rescue-team.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { UpdateTeamStatusDto } from './dto/update-team-status.dto';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Role } from '../auth/enums/role.enum';

@ApiTags('Rescue Teams (Quản lý Đội Cứu Hộ)')
@ApiBearerAuth()
@Controller('rescue-teams')
export class RescueTeamsController {
  constructor(private readonly rescueTeamsService: RescueTeamsService) { }

  // =========================================================================
  // 1. CORE CRUD
  // =========================================================================

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER)
  @Post()
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @ApiOperation({ summary: '[Admin/Manager] Tạo đội cứu hộ mới' })
  create(@Body() createRescueTeamDto: CreateRescueTeamDto) {
    return this.rescueTeamsService.create(createRescueTeamDto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get()
  @ApiOperation({ summary: 'Xem toàn bộ danh sách Đội cứu hộ (Đang hoạt động)' })
  findAll() {
    return this.rescueTeamsService.findAll();
  }

  // 🛡️ ĐÃ FIX: Chuyển Route TĨNH (available) lên TRÊN Route ĐỘNG (:id)
  @UseGuards(AuthGuard('jwt'))
  @Get('available')
  @ApiOperation({ summary: 'Xem danh sách Đội cứu hộ đang Rảnh (AVAILABLE)' })
  findAvailable() {
    return this.rescueTeamsService.findAvailable();
  }

  // 👇 Route ĐỘNG nằm ở đây mới an toàn
  @UseGuards(AuthGuard('jwt'))
  @Get(':id')
  @ApiOperation({ summary: 'Xem chi tiết 1 Đội cứu hộ' })
  findOne(@Param('id') id: string) {
    return this.rescueTeamsService.findOne(id);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER, Role.COORDINATOR)
  @Patch(':id')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @ApiOperation({ summary: '[Admin/Manager/Coordinator] Cập nhật thông tin cơ bản (Tên, Khu vực)' })
  update(
    @Param('id') id: string,
    @Body() updateRescueTeamDto: UpdateRescueTeamDto
  ) {
    return this.rescueTeamsService.update(id, updateRescueTeamDto);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER)
  @Delete(':id')
  @ApiOperation({ summary: '[Admin/Manager] Giải tán Đội cứu hộ & Tự động thu hồi xe' })
  remove(@Param('id') id: string) {
    return this.rescueTeamsService.remove(id);
  }

  // =========================================================================
  // 2. QUẢN LÝ NHÂN SỰ VÀ PHƯƠNG TIỆN
  // =========================================================================

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER)
  @Post(':id/members/:userId')
  @ApiOperation({ summary: '[Admin/Manager] Thêm thành viên vào đội' })
  addMember(@Param('id') teamId: string, @Param('userId') userId: string) {
    return this.rescueTeamsService.addMember(teamId, userId);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER)
  @Delete(':id/members/:userId')
  @ApiOperation({ summary: '[Admin/Manager] Xóa thành viên khỏi đội' })
  removeMember(@Param('id') teamId: string, @Param('userId') userId: string) {
    return this.rescueTeamsService.removeMember(teamId, userId);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER, Role.COORDINATOR)
  @Post(':id/vehicles/:vehicleId')
  @ApiOperation({ summary: '[Admin/Manager/Coordinator] Cấp phương tiện cho đội (Bọc Transaction)' })
  addVehicle(@Param('id') teamId: string, @Param('vehicleId') vehicleId: string) {
    return this.rescueTeamsService.addVehicle(teamId, vehicleId);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER, Role.COORDINATOR)
  @Delete(':id/vehicles/:vehicleId')
  @ApiOperation({ summary: '[Admin/Manager/Coordinator] Thu hồi phương tiện của đội (Bọc Transaction)' })
  removeVehicle(@Param('id') teamId: string, @Param('vehicleId') vehicleId: string) {
    return this.rescueTeamsService.removeVehicle(teamId, vehicleId);
  }

  // =========================================================================
  // 3. NGHIỆP VỤ GPS VÀ TRẠNG THÁI (STATUS)
  // =========================================================================

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.RESCUE_TEAM)
  @Patch(':id/location')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @ApiOperation({ summary: '[Team] Cập nhật vị trí GPS liên tục' })
  updateLocation(
    @Param('id') id: string,
    @Body() updateLocationDto: UpdateLocationDto,
    @Req() req: any
  ) {
    return this.rescueTeamsService.updateLocation(id, updateLocationDto);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.RESCUE_TEAM, Role.COORDINATOR, Role.ADMIN, Role.MANAGER)
  @Patch(':id/status')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @ApiOperation({ summary: '[Team/Coordinator/Admin] Cập nhật trạng thái Đội (AVAILABLE / OFFLINE)' })
  updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateTeamStatusDto,
    @Req() req: any
  ) {
    const userRole = req.user.role;
    return this.rescueTeamsService.updateStatus(id, updateStatusDto, userRole);
  }
}