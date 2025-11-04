import { Module } from '@nestjs/common';
import { UploadsController } from './uploads.controller';
import { UploadsService } from './uploads.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Upload } from './entities/upload.entity';
import { ObservationsModule } from '../observation/observations/observations.module';

@Module({
    imports: [
        ObservationsModule,
        TypeOrmModule.forFeature([Upload]),
    ],
    controllers: [UploadsController],
    providers: [UploadsService],
    exports: [UploadsService],
})
export class UploadsModule {}
