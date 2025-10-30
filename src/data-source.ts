import { BirdDistribution } from './modules/bird/bird-distribution/entities/bird-distribution.entity';
import { BirdFood } from 'src/modules/bird/bird-foods/entities/bird-food.entity';
import { Bird } from 'src/modules/bird/birds/entities/bird.entity';
import { CommonName } from 'src/modules/bird/common-names/entities/common-name.entity';
import { ConservationStatus } from 'src/modules/bird/conservation-status/entities/conservation-status.entity';
import { Food } from 'src/modules/bird/foods/entities/food.entity';
import { Habitat } from 'src/modules/bird/habitats/entities/habitat.entity';
import { Taxonomy } from 'src/modules/bird/taxonomy/entities/taxonomy.entity';
import { Observation } from 'src/modules/observation/observations/entities/observation.entity';
import { Upload } from 'src/modules/uploads/entities/upload.entity';
import { DataSource } from 'typeorm';
import { Media } from './modules/media/entities/media.entity';

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
    migrations: ['dist/migrations/*.ts'],
});

export default AppDataSource;
