import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, Max, Min } from 'class-validator';

export class UpdateLocationDto {
    @ApiProperty({ example: 10.762622, description: 'Vĩ độ (Latitude) - Nằm ngang' })
    @IsNotEmpty()
    @IsNumber()
    @Min(-90, { message: 'Vĩ độ không hợp lệ (Phải từ -90 đến 90)' })
    @Max(90, { message: 'Vĩ độ không hợp lệ (Phải từ -90 đến 90)' })
    latitude: number;

    @ApiProperty({ example: 106.660172, description: 'Kinh độ (Longitude) - Nằm dọc' })
    @IsNotEmpty()
    @IsNumber()
    @Min(-180, { message: 'Kinh độ không hợp lệ (Phải từ -180 đến 180)' })
    @Max(180, { message: 'Kinh độ không hợp lệ (Phải từ -180 đến 180)' })
    longitude: number;
}