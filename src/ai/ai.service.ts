import { Injectable } from '@nestjs/common';

@Injectable()
export class AiService {

    async identifyBird(fileUrl: string ,type: 'image'| 'audio'): Promise<string>{
      return 'cardial cardinalist';
  }   
}