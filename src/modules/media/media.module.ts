import { Module } from '@nestjs/common';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Media } from './entities/media.entity';
import { Bird } from '../bird/birds/entities/bird.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Media, Bird])],
    controllers: [MediaController],
    providers: [MediaService],
    exports: [TypeOrmModule, MediaService],
})
export class MediaModule {}
