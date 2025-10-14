import { Module } from "@nestjs/common";
import { UploadsController } from "./uploads.controller";
import { UploadsService } from "./uploads.service";
import { ObservationsModule } from "src/modules/observations/observations.module";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Upload } from "./entities/upload.entity";

@Module({
    imports: [ObservationsModule, TypeOrmModule.forFeature([Upload])],
    controllers: [UploadsController],
    providers: [UploadsService],
    exports: [UploadsService],
})
export class UploadsModule {}
