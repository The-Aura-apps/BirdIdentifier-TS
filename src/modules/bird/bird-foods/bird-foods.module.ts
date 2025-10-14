import { Module } from '@nestjs/common';
import { BirdFoodsController } from './bird-foods.controller';
import { BirdFoodsService } from './bird-foods.service';

@Module({
  controllers: [BirdFoodsController],
  providers: [BirdFoodsService]
})
export class BirdFoodsModule {}
