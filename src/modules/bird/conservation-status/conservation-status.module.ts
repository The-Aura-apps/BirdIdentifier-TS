import { Module } from '@nestjs/common';
import { ConservationStatusController } from './conservation-status.controller';
import { ConservationStatusService } from './conservation-status.service';

@Module({
    controllers: [ConservationStatusController],
    providers: [ConservationStatusService],
})
export class ConservationStatusModule {}
