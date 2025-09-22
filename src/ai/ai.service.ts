import { Injectable } from '@nestjs/common';

@Injectable()
export class AiService {
  constructor(
    private readonly imageAi
    private read only
  ){}

    async identifyBird(fileData: Buffer ,type: 'image'| 'audio'): Promise<string>{

      if(type == 'image'){
        return 'a';
      } else {
        return 'b';
      }
  }   
}