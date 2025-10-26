import { Module } from '@nestjs/common';
import { FoodController } from './foods.controller';
import { FoodService } from './foods.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Food } from './entities/food.entity';
import { BirdFoodsModule } from '../bird-foods/bird-foods.module';

@Module({
    imports: [TypeOrmModule.forFeature([Food]), BirdFoodsModule],
    controllers: [FoodController],
    providers: [FoodService],
    exports: [FoodService],
})
export class FoodsModule {}
