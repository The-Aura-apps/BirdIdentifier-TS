import { Module } from '@nestjs/common';
import { HabitatController } from './habitats.controller';
import { HabitatService } from './habitats.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Habitat } from './entities/habitat.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Habitat])],
    controllers: [HabitatController],
    providers: [HabitatService],
    exports: [TypeOrmModule],
})
export class HabitatsModule {}
