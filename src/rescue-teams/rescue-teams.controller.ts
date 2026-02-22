import { Controller, Get, Post, Body, Patch, Param, UseGuards, ValidationPipe, UsePipes } from '@nestjs/common';
import { RescueTeamsService } from './rescue-teams.service';
import { CreateRescueTeamDto } from './dto/create-rescue-team.dto';
import { UpdateRescueTeamDto } from './dto/update-rescue-team.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

// 👇 Import lại AuthGuard chuẩn
import { AuthGuard } from '@nestjs/passport';

import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Role } from '../auth/enums/role.enum';

@ApiTags('Rescue Teams (Quản lý Đội Cứu Hộ)')
@ApiBearerAuth()
@Controller('rescue-teams')
export class RescueTeamsController {
  constructor(private readonly rescueTeamsService: RescueTeamsService) { }

  @UseGuards(AuthGuard('jwt'), RolesGuard) // 👈 Dùng lại AuthGuard xịn
  @Roles(Role.ADMIN, Role.MANAGER)
  @Post()
  @UsePipes(new ValidationPipe())
  @ApiOperation({ summary: '[Admin/Manager] Tạo đội cứu hộ mới' })
  create(@Body() createRescueTeamDto: CreateRescueTeamDto) {
    return this.rescueTeamsService.create(createRescueTeamDto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get()
  @ApiOperation({ summary: 'Xem toàn bộ danh sách Đội cứu hộ' })
  findAll() {
    return this.rescueTeamsService.findAll();
  }

  @UseGuards(AuthGuard('jwt'))
  @Get(':id')
  @ApiOperation({ summary: 'Xem chi tiết 1 Đội cứu hộ' })
  findOne(@Param('id') id: string) {
    return this.rescueTeamsService.findOne(id);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER, Role.COORDINATOR)
  @Patch(':id')
  @UsePipes(new ValidationPipe())
  @ApiOperation({ summary: '[Admin/Manager/Coordinator] Cập nhật đội / Cấp phương tiện' })
  update(
    @Param('id') id: string,
    @Body() updateRescueTeamDto: UpdateRescueTeamDto
  ) {
    return this.rescueTeamsService.update(id, updateRescueTeamDto);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.RESCUE_TEAM)
  @Patch(':id/location')
  @UsePipes(new ValidationPipe())
  @ApiOperation({ summary: '[Team] Cập nhật vị trí GPS liên tục' })
  updateLocation(
    @Param('id') id: string,
    @Body() updateLocationDto: UpdateLocationDto
  ) {
    return this.rescueTeamsService.updateLocation(id, updateLocationDto);
  }
}