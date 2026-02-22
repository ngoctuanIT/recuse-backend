import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 👇 1. BẬT CORS (Rất quan trọng): Cho phép Frontend ở domain khác gọi API vào đây
  app.enableCors({
    origin: '*', // Tạm thời cho phép tất cả. Sau này FE có link chính thức thì thay vào đây để bảo mật.
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // Validation chung cho toàn hệ thống
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, // Tự động loại bỏ các field rác không có trong DTO
  }));

  // CẤU HÌNH SWAGGER
  const config = new DocumentBuilder()
    .setTitle('Rescue System APIs')
    .setDescription('Tài liệu API cho hệ thống cứu hộ lũ lụt')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  // 👇 2. CẤU HÌNH PORT ĐỘNG CHO RENDER
  // Render sẽ tự động gán một Port qua process.env.PORT. Nếu chạy ở máy tính thì dùng 3000.
  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`🚀 Server đang chạy tại: http://localhost:${port}`);
  console.log(`📖 Swagger API Docs: http://localhost:${port}/api`);
}
bootstrap();