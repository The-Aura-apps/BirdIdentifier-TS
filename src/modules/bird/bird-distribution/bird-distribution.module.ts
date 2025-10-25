import { Module } from '@nestjs/common';
import { BirdDistributionController } from './bird-distribution.controller';
import { BirdDistributionService } from './bird-distribution.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BirdDistribution } from './entities/bird-distribution.entity';

@Module({
    imports: [TypeOrmModule.forFeature([BirdDistribution])],
    controllers: [BirdDistributionController],
    providers: [BirdDistributionService],
})
export class BirdDistributionModule {}
