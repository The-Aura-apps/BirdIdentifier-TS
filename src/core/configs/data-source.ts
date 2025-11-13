import { DataSource } from 'typeorm';
import { Bird } from '../../modules/bird/birds/entities/bird.entity';
import { Upload } from '../../modules/uploads/entities/upload.entity';
import { Observation } from '../../modules/observation/observations/entities/observation.entity';
import { BirdDistribution } from '../../modules/bird/bird-distribution/entities/bird-distribution.entity';
import { BirdFood } from '../../modules/bird/bird-foods/entities/bird-food.entity';
import { CommonName } from '../../modules/bird/common-names/entities/common-name.entity';
import { ConservationStatus } from '../../modules/bird/conservation-status/entities/conservation-status.entity';
import { Food } from '../../modules/bird/foods/entities/food.entity';
import { Habitat } from '../../modules/bird/habitats/entities/habitat.entity';
import { Taxonomy } from '../../modules/bird/taxonomy/entities/taxonomy.entity';
import { Media } from '../../modules/media/entities/media.entity';

// Load environment variables
import * as dotenv from 'dotenv';
dotenv.config();

// TypeORM DataSource configuration
export const AppDataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'youshellpass',
    database: process.env.DB_NAME || 'bird-idf-x1',
    entities: [
        Bird,
        Upload,
        Observation,
        BirdDistribution,
        BirdFood,
        CommonName,
        ConservationStatus,
        Food,
        Habitat,
        Taxonomy,
        Media,
    ],
    migrations: ['src/migrations/*.ts'],
    synchronize: false, // Production-safe (set true in dev if needed)
    logging: true,
});

// ✅ Additional NestJS config factory (for ConfigModule)
export default () => ({
    database: {
        type: 'postgres',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432', 10),
        username: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || 'youshellpass',
        database: process.env.DB_NAME || 'bird-idf-x1',
        synchronize: true, // ⚠️ Enable for development only!
    },
});
