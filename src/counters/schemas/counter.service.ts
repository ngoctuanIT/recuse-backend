// src/counters/counters.service.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Counter } from './counter.schema';

@Injectable()
export class CountersService {
    constructor(@InjectModel(Counter.name) private counterModel: Model<Counter>) { }

    async getNextSequence(modelName: string): Promise<number> {
        const counter = await this.counterModel.findOneAndUpdate(
            { modelName: modelName },
            { $inc: { seq: 1 } }, // Tăng số lên 1 (Atomic update)
            { returnDocument: 'after', upsert: true }
        );
        return counter.seq;
    }
}