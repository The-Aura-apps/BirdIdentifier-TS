import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BirdsService } from './birds.service';
import { BirdsController } from './birds.controller';
import { Bird } from './entities/bird.entity';
import { BirdDistribution } from '../bird-distribution/entities/bird-distribution.entity';
import { BirdFood } from '../bird-foods/entities/bird-food.entity';
import { CommonName } from '../common-names/entities/common-name.entity';
import { Habitat } from '../habitats/entities/habitat.entity';
import { ObservationsModule } from 'src/modules/observation/observations/observations.module';
import { BirdFoodsModule } from '../bird-foods/bird-foods.module';
import { HabitatsModule } from '../habitats/habitats.module';
import { CommonNamesModule } from '../common-names/common-names.module';
import { BirdInfoWrapper } from 'src/modules/ai/wrappers/bird-info.wrapper';
import { Taxonomy } from '../taxonomy/entities/taxonomy.entity';
import { TaxonomyModule } from '../taxonomy/taxonomy.module';
import { ConservationStatus } from '../conservation-status/entities/conservation-status.entity';
import { ConservationStatusModule } from '../conservation-status/conservation-status.module';
import { Food } from '../foods/entities/food.entity';
import { Media } from 'src/modules/media/entities/media.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Bird,
            BirdDistribution,
            BirdFood,
            CommonName,
            Habitat,
            Food,
            Media,
        ]),
        TaxonomyModule,
        ConservationStatusModule,
        forwardRef(() => ObservationsModule),
        BirdFoodsModule,
        HabitatsModule,
        CommonNamesModule,
    ],
    controllers: [BirdsController],
    providers: [BirdsService, BirdInfoWrapper],
    exports: [BirdsService, TypeOrmModule],
})
export class BirdsModule {}
