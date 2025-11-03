import { Module } from '@nestjs/common';
import { ConservationStatusController } from './conservation-status.controller';
import { ConservationStatusService } from './conservation-status.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConservationStatus } from './entities/conservation-status.entity';

@Module({
    imports: [TypeOrmModule.forFeature([ConservationStatus])],
    controllers: [ConservationStatusController],
    providers: [ConservationStatusService],
    exports: [ConservationStatusService, TypeOrmModule], 
})
export class ConservationStatusModule {}
