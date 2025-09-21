import { Injectable } from '@nestjs/common';

@Injectable()
export class AiService {

    async identifyBird(fileData: Buffer ,type: 'image'| 'audio'): Promise<string>{
      return 'cardial cardinalist';
  }   
}