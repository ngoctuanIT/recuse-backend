import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { TeamStatus } from '../enums/team-status.enum'; // Đường dẫn tới file Enum của bạn

export class UpdateTeamStatusDto {
    @ApiProperty({ enum: TeamStatus, example: TeamStatus.OFFLINE })
    @IsNotEmpty()
    @IsEnum(TeamStatus, { message: 'Trạng thái không hợp lệ' })
    status: TeamStatus;
}