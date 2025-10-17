import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BirdsController } from './birds.controller';
import { BirdsService } from './birds.service';
import { Bird } from './entities/bird.entity';
import { BirdFood } from '../bird-foods/entities/bird-food.entity';
import { Habitat } from '../habitats/entities/habitat.entity';
import { CommonName } from '../common-names/entities/common-name.entity';
import { AiModule } from 'src/modules/ai/ai.module';
import { ObservationsModule } from 'src/modules/observation/observations/observations.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Bird, BirdFood, Habitat, CommonName]),
        forwardRef(() => ObservationsModule),
        AiModule,
    ],
    controllers: [BirdsController],
    providers: [BirdsService],
    exports: [BirdsService],
})
export class BirdsModule {}
