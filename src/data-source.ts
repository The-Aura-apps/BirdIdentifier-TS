import { DataSource, DataSourceOptions } from 'typeorm';
import * as dotenv from 'dotenv';
import { join } from 'path';

// Load environment variables
dotenv.config();

// Determine if we're in development or production
const isProduction = process.env.NODE_ENV === 'production';

// Base configuration
const baseConfig: DataSourceOptions = {
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'youshellpass',
    database: process.env.DB_NAME || 'bird-idf-x1',
    synchronize: false,
    logging: process.env.DB_LOGGING === 'true',
};

// Development configuration
const developmentConfig: DataSourceOptions = {
    ...baseConfig,
    entities: [join(__dirname, '**', '*.entity.{ts,js}')],
    migrations: [join(__dirname, 'migrations', '*.{ts,js}')],
    migrationsTableName: 'migrations',
};

// Production configuration
const productionConfig: DataSourceOptions = {
    ...baseConfig,
    entities: [join(__dirname, '**', '*.entity.js')],
    migrations: [join(__dirname, 'migrations', '*.js')],
    migrationsTableName: 'migrations',
};

// Export the appropriate DataSource
export const AppDataSource = new DataSource(isProduction ? productionConfig : developmentConfig);

// Initialize the data source
if (require.main === module) {
    AppDataSource.initialize()
        .then(() => {
            console.log('✅ Data Source initialized successfully');
        })
        .catch((err) => {
            console.error('❌ Error during Data Source initialization:', err);
            process.exit(1);
        });
}

// Default export for NestJS ConfigModule
export default () => ({
    database: {
        type: 'postgres',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432', 10),
        username: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || 'youshellpass',
        database: process.env.DB_NAME || 'bird-idf-x1',
        synchronize: process.env.NODE_ENV !== 'production',
        logging: process.env.DB_LOGGING === 'true',
    },
});
