import { Catch, Injectable } from '@nestjs/common';
import { AudioAiWrapper } from './wrappers/audio-ai.wrapper';
import { ImageAiWrapper } from './wrappers/image-ai.wrapper';
import { BirdInfoWrapper } from './wrappers/bird-info.wrapper';
import { BirdAiResponse, IdentificationResult, BirdInfo } from './types';

@Injectable()
export class AiService {
  constructor(
    private readonly imageAi: ImageAiWrapper,
    private readonly audioAi: AudioAiWrapper,
    private readonly birdInfo: BirdInfoWrapper,
  ) {}

  async process(
    fileData: Buffer,
    type: 'image' | 'audio',
  ): Promise<BirdAiResponse> {
    try {
      const identification = await (type === 'image'
        ? this.imageAi.identify(fileData)
        : this.audioAi.identify(fileData));

      if (!identification) {
        return { status: 'failed', error: 'No result from AI' };
      }

      const confidence = identification.confidence ?? 0;

      if (!identification.scientificName) {
        return { status: 'failed', error: 'No scientificName returned by AI' };
      }

      if (identification.confidence < 0.7) {
        return { status: 'uncertain', confidence };
      }

      // gather info
      let info: BirdInfo;
      try {
        info = await this.birdInfo.fetchInfo(identification.scientificName);
      } catch (err) {
        // fallback: identified with partial info
        return {
          status: 'identified',
          confidence,
          result: {
            scientificName: identification.scientificName,
            commonName: '',
          } as BirdInfo,
        };
      }

      return {
        status: 'identified',
        confidence,
        result: info,
      };
    } catch (err) {
      return { status: 'failed', error: (err as Error).message };
    }
  }
}