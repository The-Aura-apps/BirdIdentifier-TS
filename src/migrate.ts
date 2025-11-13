import { AppDataSource } from './data-source';

async function runMigrations() {
    try {
        await AppDataSource.initialize();
        console.log('✅ Data Source initialized');

        await AppDataSource.runMigrations();
        console.log('✅ Migrations executed successfully');

        await AppDataSource.destroy();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error during migration:', error);
        process.exit(1);
    }
}

runMigrations();
