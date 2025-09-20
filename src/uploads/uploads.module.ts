import { Module } from '@nestjs/common';
import { UploadsController } from './uploads.controller';
import { UploadsService } from './uploads.service';
import { ObservationsModule } from 'src/observations/observations.module';
import { ObservationsService } from 'src/observations/observations.service';

@Module({
  imports: [
    ObservationsModule,
  ],
  controllers: [UploadsController],
  providers: [UploadsService],
  exports: [UploadsService],
})
export class UploadsModule {}
