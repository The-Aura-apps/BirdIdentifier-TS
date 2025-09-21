import { Module } from '@nestjs/common';
import { BirdsController } from './birds.controller';
import { Bird } from './entities/bird.entity';
import { BirdsService } from './birds.service';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([Bird])],
  controllers: [BirdsController],
  providers: [BirdsService],
  exports: [BirdsService], // export so AI/Uploads modules can use it
})
export class BirdsModule {}
