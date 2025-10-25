import { Module, forwardRef } from '@nestjs/common';
import { BirdsService } from './birds.service';
import { BirdsController } from './birds.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Bird } from './entities/bird.entity';
import { BirdDistribution } from '../bird-distribution/entities/bird-distribution.entity';
import { ObservationsModule } from 'src/modules/observation/observations/observations.module';
import { BirdFoodsModule } from '../bird-foods/bird-foods.module';
import { HabitatsModule } from '../habitats/habitats.module';
import { CommonNamesModule } from '../common-names/common-names.module';
import { BirdInfoWrapper } from 'src/modules/ai/wrappers/bird-info.wrapper';

@Module({
    imports: [
        TypeOrmModule.forFeature([Bird, BirdDistribution]),
        forwardRef(() => ObservationsModule),
        BirdFoodsModule,
        HabitatsModule,
        CommonNamesModule,
    ],
    controllers: [BirdsController],
    providers: [BirdsService, BirdInfoWrapper],
    exports: [BirdsService],
})
export class BirdsModule {}
