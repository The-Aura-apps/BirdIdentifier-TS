import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BirdDistributionController } from './bird-distribution.controller';
import { BirdDistributionService } from './bird-distribution.service';
import { BirdDistribution } from './entities/bird-distribution.entity';
import { Bird } from '../birds/entities/bird.entity';

@Module({
    imports: [TypeOrmModule.forFeature([BirdDistribution, Bird])],
    controllers: [BirdDistributionController],
    providers: [BirdDistributionService],
    exports: [TypeOrmModule, BirdDistributionService],
})
export class BirdDistributionModule {}
