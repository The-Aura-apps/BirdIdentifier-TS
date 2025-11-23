import { forwardRef, Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { ImageAiWrapper } from './wrappers/image-ai.wrapper';
import { AudioAiWrapper } from './wrappers/audio-ai.wrapper';
import { BirdInfoWrapper } from './wrappers/bird-info.wrapper';
import { BirdsModule } from '../bird/birds/birds.module';
import { ConfigModule } from '@nestjs/config';

@Module({
    imports: [forwardRef(() => BirdsModule), ConfigModule],
    providers: [AiService, ImageAiWrapper, AudioAiWrapper, BirdInfoWrapper],
    exports: [AiService],
})
export class AiModule {}
