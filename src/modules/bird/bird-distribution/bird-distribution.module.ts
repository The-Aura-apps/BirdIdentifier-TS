import { Module } from '@nestjs/common';
import { BirdDistributionController } from './bird-distribution.controller';
import { BirdDistributionService } from './bird-distribution.service';

@Module({
  controllers: [BirdDistributionController],
  providers: [BirdDistributionService]
})
export class BirdDistributionModule {}
