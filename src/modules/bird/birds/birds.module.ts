import { Module } from "@nestjs/common";
import { BirdsController } from "./birds.controller";
import { Bird } from "./entities/bird.entity";
import { BirdsService } from "./birds.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { BirdInfoWrapper } from "src/modules/ai/wrappers/bird-info.wrapper";

@Module({
    imports: [TypeOrmModule.forFeature([Bird])],
    controllers: [BirdsController],
    providers: [BirdsService, BirdInfoWrapper],
    exports: [BirdsService], // export so AI/Uploads modules can use it
})
export class BirdsModule {}
