import { Module } from '@nestjs/common';
import { BirdFoodsController } from './bird-foods.controller';
import { BirdFoodsService } from './bird-foods.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BirdFood } from './entities/bird-food.entity';

@Module({
    imports: [TypeOrmModule.forFeature([BirdFood])],
    controllers: [BirdFoodsController],
    providers: [BirdFoodsService],
    exports: [TypeOrmModule, BirdFoodsService],
})
export class BirdFoodsModule {}
