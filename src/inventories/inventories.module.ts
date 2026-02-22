import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { InventoriesService } from './inventories.service';
import { InventoriesController } from './inventories.controller';
import { Inventory, InventorySchema } from './schemas/inventory.schema';

@Module({
    imports: [MongooseModule.forFeature([{ name: Inventory.name, schema: InventorySchema }])],
    controllers: [InventoriesController],
    providers: [InventoriesService],
    exports: [InventoriesService, MongooseModule], // 👈 Cực kỳ quan trọng
})
export class InventoriesModule { }