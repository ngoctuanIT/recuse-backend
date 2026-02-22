import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config'; // 👈 1. Import Config cho file .env
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

import { RescueTeamsModule } from './rescue-teams/rescue-teams.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { RescueRequestsModule } from './rescue-requests/rescue-requests.module';
import { UploadModule } from './upload/upload.module';
import { CountersModule } from './counters/schemas/counter.module';
import { VehiclesModule } from './vehicles/vehicles.module';
import { InventoriesModule } from './inventories/inventories.module';

@Module({
  imports: [
    // 2. Kích hoạt file .env cho toàn bộ dự án (NÊN ĐẶT LÊN ĐẦU TIÊN)
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // 3. Kết nối Database bằng link từ file .env (hoặc biến môi trường trên Render)
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGO_URI'), // Tên biến trong file .env của bạn
      }),
      inject: [ConfigService],
    }),

    // 4. Cấu hình thư mục chứa ảnh Upload
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
    }),

    // Các Module hệ thống
    AuthModule,
    UsersModule,
    RescueRequestsModule,
    RescueTeamsModule,
    UploadModule,
    InventoriesModule,
    CountersModule,
    VehiclesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }