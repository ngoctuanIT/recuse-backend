import { Controller, Post, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';

@ApiTags('Upload')
@Controller('upload')
export class UploadController {

  @Post('image')
  @ApiOperation({ summary: 'Upload file ảnh (jpg, png, gif)' }) // ✨ 1. Thêm mô tả cho dễ hiểu
  @ApiConsumes('multipart/form-data') // ✨ 2. Báo cho Swagger biết đây là form upload
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { // ⚠️ Tên này phải trùng với chữ 'file' bên dưới
          type: 'string',
          format: 'binary', // ✨ 3. Biến ô nhập thành nút "Choose File"
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file', {
    // 1. Cấu hình nơi lưu và tên file
    storage: diskStorage({
      destination: './uploads',
      filename: (req, file, callback) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = extname(file.originalname);
        callback(null, `${uniqueSuffix}${ext}`);
      },
    }),
    // 2. Validate loại file (Chỉ cho phép ảnh)
    fileFilter: (req, file, callback) => {
      if (!file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
        return callback(new BadRequestException('Chỉ chấp nhận file ảnh!'), false);
      }
      callback(null, true);
    },
  }))
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Vui lòng chọn file!');
    }

    // Trả về đường dẫn file
    return {
      url: `/uploads/${file.filename}`
    };
  }
}