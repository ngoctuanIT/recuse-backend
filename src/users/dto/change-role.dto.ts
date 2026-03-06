import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { Role } from '../../auth/enums/role.enum'; // Sửa đường dẫn nếu cần

export class ChangeRoleDto {
    @ApiProperty({ enum: Role, description: 'Quyền hạn mới muốn cấp cho User' })
    @IsEnum(Role, { message: 'Quyền hạn không hợp lệ' })
    @IsNotEmpty({ message: 'Vui lòng chọn quyền hạn' })
    role: Role;
}