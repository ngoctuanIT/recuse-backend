import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { VehiclesService } from './vehicles.service';
import { VehiclesController } from './vehicles.controller';
import { Vehicle, VehicleSchema } from './schemas/vehicle.schema';
import { RescueTeam, RescueTeamSchema } from '../rescue-teams/schemas/rescue-team.schema';
@Module({
    imports: [
        // Khai báo Schema để Service có thể chọc xuống Database
        MongooseModule.forFeature([{ name: Vehicle.name, schema: VehicleSchema }]),
        MongooseModule.forFeature([{ name: RescueTeam.name, schema: RescueTeamSchema }]),
    ],
    controllers: [VehiclesController],
    providers: [VehiclesService],
    // Export ra để các module khác (như RescueTeamsModule) có thể gọi ké VehiclesService
    exports: [VehiclesService, MongooseModule],
})
export class VehiclesModule { }