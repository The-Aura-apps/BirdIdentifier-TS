import { Catch, Injectable } from '@nestjs/common';
import { AudioAiWrapper } from './wrappers/audio-ai.wrapper';
import { ImageAiWrapper } from './wrappers/image-ai.wrapper';
import { BirdInfoWrapper } from './wrappers/bird-info.wrapper';
import { BirdAiRespone, IdentificationResult, BirdInfo } from './types';

@Injectable()
export class AiService {
  constructor(
    private readonly imageAi: ImageAiWrapper,
    private readonly audioAi: AudioAiWrapper,
    private readonly birdInfo: BirdInfoWrapper,
  ) { }

  async process(fileData: Buffer, type: 'image' | 'audio'): Promise<BirdAiRespone> {
    try {
      const identification = await (type === 'image'
      ? this.imageAi.identify(fileData)
      : this.audioAi.identify(fileData));

      if (!identification) {
        return { status: 'failed', error: 'No result from AI' };
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