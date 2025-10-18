import { Module } from '@nestjs/common';
import { FoodController } from './foods.controller';
import { FoodService } from './foods.service';

@Module({
    controllers: [FoodController],
    providers: [FoodService],
})
export class FoodsModule {}
