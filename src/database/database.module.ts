import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Observation } from "../modules/observations/entities/observation.entity";
import { ObservationsModule } from "src/modules/observations/observations.module";
import { Bird } from "src/modules/bird/birds/entities/bird.entity";
import { Upload } from "src/modules/uploads/entities/upload.entity";
@Module({
    imports: [
        TypeOrmModule.forRoot({
            type: "postgres",
            host: "localhost",
            port: 5432,
            username: "postgres",
            password: "youshellpass",
            database: "bird-identifier",
            entities: [Observation, Bird, Upload],
            synchronize: true, // Mack True When Released
        }),
    ],
    //exports: [TypeOrmModule],  // redundent I thinlk
})
export class DatabaseModule {}
