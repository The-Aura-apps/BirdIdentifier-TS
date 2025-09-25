import { Injectable } from "@nestjs/common";
import { IdentificationResult } from "../types";


@Injectable()
export class AudioAiWrapper {
  async identify(file: Buffer): Promise<IdentificationResult> {
    // ToDo API call
    
    return {
        scientificName:'' ,
        confidence: 5,
    }
  }
}