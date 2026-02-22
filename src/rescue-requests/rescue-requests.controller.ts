import { Controller, Get, Post, Body, UseGuards, Request, UsePipes, ValidationPipe, Query, Patch, Param } from '@nestjs/common';
import { RescueRequestsService } from './rescue-requests.service';
import { CreateRescueRequestDto } from './dto/create-rescue-request.dto';
import { QueryRescueRequestDto } from './dto/query-rescue-request.dto';
import { AuthGuard } from '@nestjs/passport';
import { UpdateStatusDto } from './dto/update-status.dto';
import { AssignTeamDto } from './dto/assign-team.dto';
import { VerifyRequestDto } from './dto/verify-request.dto';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';

// 👇 1. IMPORT CÁC FILE BẢO MẬT BẠN VỪA TẠO
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Role } from '../auth/enums/role.enum';

@ApiTags('Rescue Requests')
@ApiBearerAuth()
@Controller('rescue-requests')
export class RescueRequestsController {
  constructor(private readonly rescueRequestsService: RescueRequestsService) { }

  // ====================================================================
  // 1. NHÓM API TĨNH (BẮT BUỘC PHẢI ĐẶT TRÊN CÙNG)
  // ====================================================================

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.RESCUE_TEAM) // 👈 Chỉ Đội cứu hộ mới được bật Radar
  @Get('nearby')
  @ApiOperation({ summary: '[Team] Radar: Tìm kiếm yêu cầu cứu hộ gần đây' })
  findNearby(@Query(new ValidationPipe({ transform: true })) query: QueryRescueRequestDto) {
    return this.rescueRequestsService.findNearby(query);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.CITIZEN) // 👈 Chỉ Người dân mới xem lịch sử kêu cứu của mình
  @Get('my-requests')
  @ApiOperation({ summary: '[Citizen] Xem lịch sử kêu cứu của bản thân' })
  findMyRequests(@Request() req) {
    const userId = req.user.sub || req.user.userId;
    return this.rescueRequestsService.findMyRequests(userId);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.RESCUE_TEAM, Role.COORDINATOR) // 👈 Đội cứu hộ (hoặc Điều phối) xem nhiệm vụ
  @Get('assigned-tasks')
  @ApiOperation({ summary: '[Team] Xem các nhiệm vụ được Điều phối viên phân công' })
  @ApiQuery({ name: 'teamId', required: true, description: 'ID của đội cứu hộ' })
  findAssignedTasks(@Query('teamId') teamId: string) {
    return this.rescueRequestsService.findAssignedTasks(teamId);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.COORDINATOR, Role.ADMIN) // 👈 Chỉ Điều phối viên & Admin mới xem được tất cả đơn
  @Get()
  @ApiOperation({ summary: '[Coordinator] Lấy tất cả danh sách yêu cầu' })
  findAll() {
    return this.rescueRequestsService.findAll();
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.CITIZEN) // 👈 Chỉ Người dân mới được quyền bấm nút kêu cứu
  @Post()
  @UsePipes(new ValidationPipe())
  @ApiOperation({ summary: '[Citizen] Gửi yêu cầu cứu hộ mới' })
  create(@Body() createDto: CreateRescueRequestDto, @Request() req) {
    const userId = req.user.sub || req.user.userId;
    return this.rescueRequestsService.create(createDto, userId);
  }

  // ====================================================================
  // 2. NHÓM API ĐỘNG (CÓ CHỨA PARAM :id - PHẢI ĐẶT PHÍA DƯỚI)
  // ====================================================================

  @UseGuards(AuthGuard('jwt'))
  // API này không dùng RolesGuard vì ai tham gia vào luồng (Dân, Đội, Điều phối) cũng cần xem chi tiết
  @Get(':id')
  @ApiOperation({ summary: 'Xem chi tiết 1 yêu cầu cứu hộ cụ thể' })
  findOne(@Param('id') id: string) {
    return this.rescueRequestsService.findOne(id);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.COORDINATOR, Role.ADMIN) // 👈 Chỉ Điều phối viên mới được xác minh & phân loại
  @Patch(':id/verify')
  @ApiOperation({ summary: '[Coordinator] Xác minh yêu cầu & Phân loại khẩn cấp' })
  verifyRequest(@Param('id') id: string, @Body() verifyDto: VerifyRequestDto) {
    return this.rescueRequestsService.verifyRequest(id, verifyDto.urgencyLevel);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.RESCUE_TEAM) // 👈 Chỉ Đội cứu hộ mới được quyền cập nhật đang đi cứu hay đã xong
  @Patch(':id/status')
  @ApiOperation({ summary: '[Team] Cập nhật tiến độ cứu hộ (IN_PROGRESS, RESOLVED...)' })
  updateStatus(@Param('id') id: string, @Body() updateStatusDto: UpdateStatusDto) {
    return this.rescueRequestsService.updateStatus(id, updateStatusDto);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.COORDINATOR, Role.ADMIN) // 👈 Chỉ Điều phối viên mới được gán Đội vào Đơn
  @Patch(':id/assign')
  @ApiOperation({ summary: '[Coordinator] Điều phối: Gán đội cứu hộ cho yêu cầu này' })
  assignTeam(
    @Param('id') id: string,
    @Body() assignTeamDto: AssignTeamDto
  ) {
    return this.rescueRequestsService.assignTeam(id, assignTeamDto);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.CITIZEN) // 👈 Chỉ Người kêu cứu mới được quyền bấm chốt đơn an toàn
  @Patch(':id/confirm-rescued')
  @ApiOperation({ summary: '[Citizen] Xác nhận đã an toàn (Đóng đơn)' })
  confirmRescued(@Param('id') id: string, @Request() req) {
    const userId = req.user.sub || req.user.userId;
    return this.rescueRequestsService.confirmRescued(id, userId);
  }
}