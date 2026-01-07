import { Module } from '@nestjs/common';
import { UploadsController } from './uploads.controller';
import { UploadsService } from './uploads.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Upload } from './entities/upload.entity';
import { ObservationsModule } from '../observation/observations/observations.module';
import { AiModule } from '../ai/ai.module';
import { BirdsModule } from '../bird/birds/birds.module';

@Module({
    imports: [
        ObservationsModule,
        AiModule,
        BirdsModule,
        TypeOrmModule.forFeature([Upload]),
    ],
    controllers: [UploadsController],
    providers: [UploadsService],
    exports: [UploadsService],
})
export class UploadsModule {}
