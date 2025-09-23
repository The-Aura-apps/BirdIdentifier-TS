import { Injectable } from "@nestjs/common";
import { IdentificationResult } from "../types";


@Injectable()
export class ImageAiWrapper {
  async identify(file: Express.Multer.File): Promise<IdentificationResult> {
    // ToDo  API call

    return {
        scientificName:'AA' ,
        confidence: 0.8,
    }
  }
}