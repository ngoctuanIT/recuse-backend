import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CountersService } from './counter.service';
import { Counter, CounterSchema } from './counter.schema';

@Module({
    imports: [
        // 1. Đăng ký Schema để Service tương tác được với DB
        MongooseModule.forFeature([{ name: Counter.name, schema: CounterSchema }]),
    ],
    providers: [CountersService],
    exports: [CountersService], // 👈 QUAN TRỌNG: Phải xuất khẩu Service này ra
})
export class CountersModule { }