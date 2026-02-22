import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RescueTeamsService } from './rescue-teams.service';
import { RescueTeamsController } from './rescue-teams.controller';
import { RescueTeam, RescueTeamSchema } from './schemas/rescue-team.schema';
import { CountersModule } from '../counters/schemas/counter.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: RescueTeam.name, schema: RescueTeamSchema }]),
    CountersModule,
  ],
  controllers: [RescueTeamsController],
  providers: [RescueTeamsService],
  exports: [RescueTeamsService], // Export để module khác dùng được
})
export class RescueTeamsModule {}