import { Module } from '@nestjs/common';
import {
    ConfigModule,
    ConfigService,
} from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { BirdDistribution } from 'src/modules/bird/bird-distribution/entities/bird-distribution.entity';
import { BirdFood } from 'src/modules/bird/bird-foods/entities/bird-food.entity';
import { Bird } from 'src/modules/bird/birds/entities/bird.entity';
import { CommonName } from 'src/modules/bird/common-names/entities/common-name.entity';
import { ConservationStatus } from 'src/modules/bird/conservation-status/entities/conservation-status.entity';
import { Food } from 'src/modules/bird/foods/entities/food.entity';
import { Habitat } from 'src/modules/bird/habitats/entities/habitat.entity';
import { Taxonomy } from 'src/modules/bird/taxonomy/entities/taxonomy.entity';
import { Media } from 'src/modules/media/entities/media.entity';
import { Observation } from 'src/modules/observation/observations/entities/observation.entity';
import { Upload } from 'src/modules/uploads/entities/upload.entity';

// Import all entities

@Module({
    imports: [
        ConfigModule,
        TypeOrmModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
                type: 'postgres',
                host: configService.get<string>(
                    'database.host',
                ),
                port: configService.get<number>(
                    'database.port',
                ),
                username: configService.get<string>(
                    'database.username',
                ),
                password: configService.get<string>(
                    'database.password',
                ),
                database: configService.get<string>(
                    'database.database',
                ),
                entities: [
                    Bird,
                    CommonName,
                    ConservationStatus,
                    Taxonomy,
                    Habitat,
                    Food,
                    BirdFood,
                    BirdDistribution,
                    Observation,
                    Upload,
                    Media,
                ],
                synchronize: configService.get<boolean>(
                    'database.synchronize',
                ),
                logging: configService.get<boolean>(
                    'database.logging',
                ),
                // Production optimizations
                ...(process.env.NODE_ENV ===
                    'production' && {
                    extra: {
                        max: 20,
                        idleTimeoutMillis: 30000,
                        connectionTimeoutMillis: 2000,
                    },
                    ssl: {
                        rejectUnauthorized: false,
                    },
                }),
            }),
        }),
    ],
})
export class DatabaseModule {}
