import { Module } from '@nestjs/common';
import { BirdHabitatsController } from './bird-habitats.controller';
import { BirdHabitatsService } from './bird-habitats.service';

@Module({
  controllers: [BirdHabitatsController],
  providers: [BirdHabitatsService]
})
export class BirdHabitatsModule {}
