import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Observation } from '../observations/entities/observation.entity';
import { ObservationsModule } from 'src/observations/observations.module';
@Module({
    imports: [
        TypeOrmModule.forRoot({
            type: 'postgres',
            host: 'localhost',
            port: 5432,
            username: 'postgres',
            password: 'youshellpass',
            database: 'bird-identifier',
            entities: [Observation],
            synchronize: true, // Mack True When Released
        }),
    ],
    //exports: [TypeOrmModule],  // redundent I thinlk
})
export class DatabaseModule {}
