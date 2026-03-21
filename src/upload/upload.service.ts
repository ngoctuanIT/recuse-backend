import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import * as streamifier from 'streamifier';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UploadService {
  constructor(private configService: ConfigService) {
    // 🛡️ Nạp chìa khóa Cloudinary từ file .env (Siêu gọn, không có replace gì hết)
    cloudinary.config({
      cloud_name: this.configService.get<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get<string>('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get<string>('CLOUDINARY_API_SECRET'),
    });
  }

  // Hàm cốt lõi: Bắn ảnh thẳng lên mây Cloudinary
  async uploadImage(file: Express.Multer.File): Promise<{ url: string }> {
    if (!file) {
      throw new BadRequestException('Vui lòng đính kèm một file ảnh!');
    }

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: 'rescue_system' }, // Tự động tạo thư mục trên Cloudinary
        (error, result) => {
          if (error || !result) {
            console.error('Lỗi Cloudinary:', error);
            return reject(new InternalServerErrorException('Lỗi máy chủ khi upload ảnh!'));
          }
          // Trả về link HTTPS an toàn
          resolve({ url: result.secure_url });
        },
      );

      // Bơm luồng dữ liệu (buffer) bắn thẳng lên Cloudinary
      streamifier.createReadStream(file.buffer).pipe(uploadStream);
    });
  }
}