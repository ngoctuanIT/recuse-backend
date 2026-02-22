import { IsNotEmpty, IsNumber, IsString, IsArray, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger'; // Import cái này

export class CreateRescueRequestDto {
    @ApiProperty({ example: 'Nhà ngập sâu 2m, có người già', description: 'Mô tả tình trạng' }) // Thêm dòng này
    @IsNotEmpty()
    @IsString()
    description: string;

    @ApiProperty({ example: 21.0285, description: 'Vĩ độ' })
    @IsNotEmpty()
    @IsNumber()
    latitude: number;

    @ApiProperty({ example: 105.8542, description: 'Kinh độ' })
    @IsNotEmpty()
    @IsNumber()
    longitude: number;

    @ApiProperty({ example: ['/uploads/abc.jpg'], required: false })
    @IsOptional()
    @IsArray()
    images?: string[];
}