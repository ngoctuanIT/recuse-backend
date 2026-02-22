import { ApiProperty } from '@nestjs/swagger';

export class CreateUploadDto {
    @ApiProperty({
        description: 'File ảnh cần upload (jpg, jpeg, png, gif)',
        type: 'string',
        format: 'binary', // 👈 QUAN TRỌNG: Dòng này tạo nút "Choose File"
    })
    file: any;
}