import { Module } from "@nestjs/common";
import { ObservationsController } from "./observations.controller";
import { ObservationsService } from "./observations.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Observation } from "./entities/observation.entity";
import { BirdsModule } from "src/modules/bird/birds/birds.module";
import { AiModule } from "src/modules/ai/ai.module";

@Module({
    imports: [TypeOrmModule.forFeature([Observation]), BirdsModule, AiModule],
    controllers: [ObservationsController],
    providers: [ObservationsService],
    exports: [ObservationsService],
})
export class ObservationsModule {}
