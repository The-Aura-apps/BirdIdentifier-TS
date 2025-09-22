import { Injectable } from "@nestjs/common";


@Injectable()
export class AudioAiWrapper {
  async identify(file: Express.Multer.File): Promise<identificationResult> {
    // ToDo API call
    
    return {
        scientificName:'' ,
        confidence: '',
    }
  }
}