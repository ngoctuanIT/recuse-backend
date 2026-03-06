import { Module } from '@nestjs/common';
import { RescueRequestsService } from './rescue-requests.service';
import { RescueRequestsController } from './rescue-requests.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { RescueRequest, RescueRequestSchema } from './schemas/rescue-request.schema';
import { CountersModule } from '../counters/schemas/counter.module';

// 👇 1. Import 3 Schema mới vào đầu file
import { RescueTeam, RescueTeamSchema } from '../rescue-teams/schemas/rescue-team.schema';
import { Vehicle, VehicleSchema } from '../vehicles/schemas/vehicle.schema';
import { Inventory, InventorySchema } from '../inventories/schemas/inventory.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: RescueRequest.name, schema: RescueRequestSchema },
      // 👇 2. Khai báo thêm 3 dòng này để Service có quyền chọc vào DB
      { name: RescueTeam.name, schema: RescueTeamSchema },
      { name: Vehicle.name, schema: VehicleSchema },
      { name: Inventory.name, schema: InventorySchema }
    ]),
    CountersModule
  ],
  controllers: [RescueRequestsController],
  providers: [RescueRequestsService],
})
export class RescueRequestsModule { }