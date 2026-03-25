import {
  Controller, Post, UseInterceptors, UploadedFile,
  ParseFilePipe, MaxFileSizeValidator, FileTypeValidator, UseGuards
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';
import { ApiTags, ApiConsumes, ApiBody, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('Upload (Tải file kêu cứu)')
@ApiBearerAuth()
@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) { }

  @UseGuards(AuthGuard('jwt')) // Yêu cầu đăng nhập mới được up ảnh
  @Post('image')
  @UseInterceptors(FileInterceptor('file')) // 👈 Moi file có key là 'file'
  @ApiOperation({ summary: 'Upload 1 ảnh kêu cứu lên hệ thống (Cloudinary)' })
  @ApiConsumes('multipart/form-data') // Khai báo cho Swagger
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Chọn file ảnh (.png, .jpg, .webp)'
        },
      },
    },
  })
  async uploadImage(
    @UploadedFile(
      // 🛡️ MÀNG LỌC CHỐT CHẶN CỬA NGÕ (NESTJS PIPE)
      new ParseFilePipe({
        validators: [
          // Chốt 1: Chỉ cho phép ảnh (.png, .jpg, .jpeg, .webp)
          new FileTypeValidator({ fileType: '.(png|jpeg|jpg|webp)' }),
          // Chốt 2: Dung lượng tối đa 5MB
          new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 5 }),
        ],
        errorHttpStatusCode: 400, // Lỗi báo 400 rõ ràng
      }),
    )
    file: Express.Multer.File,
  ) {
    // Pass qua màng lọc mới cho gọi Service để bắn lên Cloudinary
    return this.uploadService.uploadImage(file);
  }
}