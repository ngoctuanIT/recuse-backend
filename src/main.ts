import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

// 👇 IMPORT CÔNG CỤ TRÍCH XUẤT DATABASE CỦA NESTJS
import { getConnectionToken } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 1. BẬT CORS (Rất quan trọng): Cho phép Frontend ở domain khác gọi API vào đây
  app.enableCors({
    origin: '*', // Tạm thời cho phép tất cả. Sau này FE có link chính thức thì thay vào đây để bảo mật.
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // 2. Validation chung cho toàn hệ thống
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, // Tự động loại bỏ các field rác không có trong DTO
  }));

  // 3. CẤU HÌNH SWAGGER
  const config = new DocumentBuilder()
    .setTitle('Rescue System APIs')
    .setDescription('Tài liệu API cho hệ thống cứu hộ lũ lụt')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  // 4. CẤU HÌNH PORT ĐỘNG CHO RENDER
  // Render sẽ tự động gán một Port qua process.env.PORT. Nếu chạy ở máy tính thì dùng 3000.
  const port = process.env.PORT || 3000;
  await app.listen(port);

  // 👇 5. ĐOẠN LOG "TRINH SÁT" TÌM THỦ PHẠM DATABASE
  console.log('\n========================================================');
  console.log(`🚀 Server đang chạy tại: http://localhost:${port}`);
  console.log(`📖 Swagger API Docs: http://localhost:${port}/api`);
  console.log('--------------------------------------------------------');

  try {
    // Móc luồng kết nối Database ngầm của NestJS ra ánh sáng
    const dbConnection = app.get<Connection>(getConnectionToken());
    const dbName = dbConnection.name;
    const dbHost = dbConnection.host;

    if (dbName === 'test') {
      console.log(`❌ CẢNH BÁO ĐỎ: Bạn đang lưu data vào Database mặc định là [ test ]`);
      console.log(`👉 Cách Fix: Mở file .env, thêm tên DB vào trước dấu ?`);
      console.log(`   VD cũ: mongodb+srv://admin:pass@cluster0.abcde.mongodb.net/?retryWrites...`);
      console.log(`   VD mới: mongodb+srv://admin:pass@cluster0.abcde.mongodb.net/rescue-db?retryWrites...`);
    } else {
      console.log(`✅ DATABASE TÊN LÀ: [ ${dbName} ]`);
    }

    console.log(`🌐 HOST ĐANG CHẠY: [ ${dbHost} ]`);
  } catch (error) {
    console.log(`⚠️ Không thể lấy thông tin Database. Có thể MongoDB chưa kết nối thành công!`);
  }
  console.log('========================================================\n');
}
bootstrap();