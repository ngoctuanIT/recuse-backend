import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RescueTeamsService } from './rescue-teams.service';
import { RescueTeamsController } from './rescue-teams.controller';
import { RescueTeam, RescueTeamSchema } from './schemas/rescue-team.schema';
import { CountersModule } from '../counters/schemas/counter.module';

// 👇 1. Import class User và UserSchema từ module Users
import { User, UserSchema } from '../users/schemas/user.schema';
import { Vehicle, VehicleSchema } from '../vehicles/schemas/vehicle.schema';



@Module({
  imports: [
    // 👇 2. Khai báo thêm User vào chung mảng với RescueTeam
    MongooseModule.forFeature([
      { name: RescueTeam.name, schema: RescueTeamSchema },
      { name: User.name, schema: UserSchema }, // Chìa khóa vàng giải quyết lỗi!
      { name: Vehicle.name, schema: VehicleSchema },
    ]),
    CountersModule,
  ],
  controllers: [RescueTeamsController],
  providers: [RescueTeamsService],
  exports: [RescueTeamsService], // Export để module khác dùng được
})
export class RescueTeamsModule { }