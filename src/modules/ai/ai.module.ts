import { forwardRef, Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { ImageAiWrapper } from './wrappers/image-ai.wrapper';
import { AudioAiWrapper } from './wrappers/audio-ai.wrapper';
import { BirdInfoWrapper } from './wrappers/bird-info.wrapper';
import { WikimediaPhotoWrapper } from './wrappers/wikimedia-photo.wrapper';
import { XenoCantoAudioWrapper } from './wrappers/xenocanto-audio.wrapper';
import { BirdsModule } from '../bird/birds/birds.module';
import { ConfigModule } from '@nestjs/config';

@Module({
    imports: [forwardRef(() => BirdsModule), ConfigModule],
    providers: [AiService, ImageAiWrapper, AudioAiWrapper, BirdInfoWrapper, WikimediaPhotoWrapper, XenoCantoAudioWrapper],
    exports: [AiService, WikimediaPhotoWrapper, XenoCantoAudioWrapper],
})
export class AiModule {}
