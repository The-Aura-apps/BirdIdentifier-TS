import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { DataCollectorService } from './data-collector.service';
import { MediaModule } from '../media/media.module';
import { DataProcessorService } from '../data-processor/data-processor/data-processor.service';
import { BirdsModule } from '../bird/birds/birds.module';

@Module({
    imports: [HttpModule, ConfigModule, BirdsModule, MediaModule],
    providers: [DataCollectorService, DataProcessorService],
    exports: [DataCollectorService, DataProcessorService],
})
export class DataCollectorModule {}
