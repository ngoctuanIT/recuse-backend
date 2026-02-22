import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type CounterDocument = HydratedDocument<Counter>;

@Schema()
export class Counter {
  @Prop({ required: true, unique: true })
  modelName: string; // Tên định danh: 'rescue_request' hoặc 'rescue_team'

  @Prop({ default: 0 })
  seq: number; // Số thứ tự hiện tại
}

export const CounterSchema = SchemaFactory.createForClass(Counter);