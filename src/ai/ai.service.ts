import { Catch, Injectable } from '@nestjs/common';
import { AudioAiWrapper } from './wrappers/audio-ai.wrapper';
import { ImageAiWrapper } from './wrappers/image-ai.wrapper';
import { BirdInfoWrapper } from './wrappers/bird-info.wrapper';
import { BirdAiRespone, IdentificationResult, BirdInfo } from './types';
import { error } from 'console';

@Injectable()
export class AiService {
  constructor(
    private readonly imageAi: ImageAiWrapper,
    private readonly audioAi: AudioAiWrapper,
    private readonly birdInfo: BirdInfoWrapper,
  ) { }

  async process(fileData: Buffer, type: 'image' | 'audio'): Promise<BirdAiRespone> {
    let identification: IdentificationResult;

    try {
      identification =
        type === 'image'
          ? await this.imageAi.identify(fileData)
          : await this.audioAi.identify(fileData);

      if (!identification) {
        return { status: 'failed', error: 'AI retuned no result' };
      }

      if (identification.confidence < 0.7) {
        return { status: 'uncertain', confidence: identification.confidence }
      }

      // gather info
      const info: BirdInfo = await this.birdInfo.fetchInfo(identification.scientificName);

      return {
        status: 'identified',
        confidence: identification.confidence,
        result: info,
      };
    } catch (err) {
      return { status: 'failed', error: (err as Error).message }
    }
  }
}