import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { CreateRescueTeamDto, TeamStatus } from './create-rescue-team.dto';
import { IsEnum, IsOptional } from 'class-validator';

// Kế thừa toàn bộ thuộc tính từ Create nhưng biến chúng thành Optional (không bắt buộc)
export class UpdateRescueTeamDto extends PartialType(CreateRescueTeamDto) {

    @ApiPropertyOptional({
        enum: TeamStatus,
        example: TeamStatus.BUSY,
        description: 'Trạng thái của đội (Sẵn sàng, Đang bận, Nghỉ ngơi)'
    })
    @IsOptional()
    @IsEnum(TeamStatus)
    status?: string;

}