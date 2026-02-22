import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose'; // Import cái này
import { RescueRequestsService } from './rescue-requests.service';
import { RescueRequestsController } from './rescue-requests.controller';
import { RescueRequest, RescueRequestSchema } from './schemas/rescue-request.schema'; // Import Schema
import { CountersModule } from '../counters/schemas/counter.module';

@Module({
  imports: [
    // Đăng ký bảng RescueRequest vào hệ thống
    MongooseModule.forFeature([{ name: RescueRequest.name, schema: RescueRequestSchema }]),
    CountersModule
  ],
  controllers: [RescueRequestsController],
  providers: [RescueRequestsService],
})
export class RescueRequestsModule { }