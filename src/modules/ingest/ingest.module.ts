import { Module } from '@nestjs/common';
import { Ingest } from './ingest';
import { IngestController } from './controlers/ingest.controller';
import { IngestService } from './ingest.service';

@Module({
  providers: [Ingest, IngestService],
  controllers: [IngestController]
})
export class IngestModule {}
