import { IsNotEmpty, IsMongoId } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignTeamDto {
  @ApiProperty({ 
    example: '65e9f74d9f1b2c0012345678', 
    description: 'ID của Đội cứu hộ sẽ nhận nhiệm vụ' 
  })
  @IsNotEmpty()
  @IsMongoId({ message: 'Team ID không hợp lệ' })
  teamId: string;
}