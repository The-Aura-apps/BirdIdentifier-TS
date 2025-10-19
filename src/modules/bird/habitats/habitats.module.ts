import { Module } from '@nestjs/common';
import { HabitatController } from './habitats.controller';
import { HabitatService } from './habitats.service';

@Module({
    controllers: [HabitatController],
    providers: [HabitatService],
})
export class HabitatsModule {}
