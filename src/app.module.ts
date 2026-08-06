import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import databaseConfig from './core/configs/database.config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BirdsModule } from './modules/bird/birds/birds.module';
import { ObservationsModule } from './modules/observation/observations/observations.module';
import { AiModule } from './modules/ai/ai.module';
import { DatabaseModule } from './core/database/database.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { NotificationModule } from './modules/observation/notification/notification.module';
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
import { DeviceSettingsModule } from './modules/device-settings/device-settings.module';
import { ArticleModule } from './modules/article/article.module';
//import { IngestModule } from './modules/ingest/ingest.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: '.env',
            load: [databaseConfig],
        }),
        // Two limits apply to every request; a request must pass both.
        //
        //  device — the real per-user limit, keyed on the `x-device-id` header
        //           the app sends. Needed because mobile carriers put many
        //           users behind one IP (CGNAT), so an IP-only limit would
        //           make legitimate users block each other. Falls back to IP
        //           when the header is absent, so unknown clients still get
        //           the tighter limit rather than an unlimited one.
        //
        //  ip     — deliberately looser, and exists because `x-device-id` is
        //           client-supplied and trivially rotated. This is the ceiling
        //           an attacker still hits after spoofing device IDs.
        //
        // Endpoints that trigger paid third-party AI calls (uploads) tighten
        // both of these further.
        ThrottlerModule.forRoot([
            {
                name: 'device',
                ttl: 60000,
                limit: 30,
                getTracker: (req) => (req.headers?.['x-device-id'] as string) || req.ip,
            },
            {
                name: 'ip',
                ttl: 60000,
                limit: 120,
            },
        ]),
        BirdsModule,
        ObservationsModule,
        AiModule,
        DatabaseModule,
        UploadsModule,
        NotificationModule,
        FoodsModule,
        HabitatsModule,
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
        DeviceSettingsModule,
        ArticleModule,
        //IngestModule,
    ],
    controllers: [AppController],
    providers: [AppService, { provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
