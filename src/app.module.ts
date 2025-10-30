import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import databaseConfig from './core/configs/database.config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BirdsModule } from './modules/bird/birds/birds.module';
import { ObservationsModule } from './modules/observation/observations/observations.module';
import { AiModule } from './modules/ai/ai.module';
import { DatabaseModule } from './core/database/database.module';
import { UploadsModule } from './modules/uploads/uploads.module';
//import { NotificationModule } from './modules/observation/notification/notification.module';
import { FoodsModule } from './modules/bird/foods/foods.module';
import { HabitatsModule } from './modules/bird/habitats/habitats.module';
import { BirdFoodsModule } from './modules/bird/bird-foods/bird-foods.module';
import { BirdHabitatsModule } from './modules/bird/bird-habitats/bird-habitats.module';
import { UserRolesModule } from './modules/user/user-roles/user-roles.module';
import { BirdDistributionModule } from './modules/bird/bird-distribution/bird-distribution.module';
import { ConservationStatusModule } from './modules/bird/conservation-status/conservation-status.module';
import { CommonNamesModule } from './modules/bird/common-names/common-names.module';
import { TaxonomyModule } from './modules/bird/taxonomy/taxonomy.module';
import { MediaModule } from './modules/media/media.module';
//import { IngestModule } from './modules/ingest/ingest.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: '.env',
            load: [databaseConfig],
        }),
        BirdsModule,
        ObservationsModule,
        AiModule,
        DatabaseModule,
        UploadsModule,
        FoodsModule,
        HabitatsModule,
        //UsersModule,
        //RolesModule,
        BirdFoodsModule,
        BirdHabitatsModule,
        UserRolesModule,
        BirdHabitatsModule,
        BirdFoodsModule,
        BirdDistributionModule,
        TaxonomyModule,
        ConservationStatusModule,
        CommonNamesModule,
        MediaModule,
        //IngestModule,
        //NotificationModule,
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {}
