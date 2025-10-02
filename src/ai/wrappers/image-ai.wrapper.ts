import { Injectable } from "@nestjs/common";
import { IdentificationResult } from "../types";
import OpenAI from "openai";
import * as fs from "fs" 

@Injectable()
export class ImageAiWrapper {
  private client: OpenAI;

  constructor() {
    if(!process.env.OPENAI_API_KEY) {
      throw Error("OPENAI_API_KEY is not set in envierment variables");
    }
    this.client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  /**
   * Identify a bird from an image buffer using GPT-4o-mini
   * @param file Buffer of the image
   * @returns IdentificationResult { scientificName, confidence }
   */
  
  async identify(file: Buffer): Promise<IdentificationResult>{
    try {
      // Convert image buffer to base64 to include in prompt
      const base64Image = file.toString("base64"); 

      const prompt = `
        You are a bird expert AI. Identify the bird in the following image (base64-encoded):
        "${base64Image}"

        Respond in JSON exactly like this:
        {
          "scientificName": "string",
          "confidence": number   // between 0 and 1
        }
        Only return JSON.
        `;

        // Call GPT-4o-mini
        const respon = await this.client.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [{ role: "user", content: prompt }],
          response_format: { type: 'json_object' },
        });

        // Parse JSON safely
        const content = respon.choices?.[0]?.message?.content ?? "{}";
        const data: IdentificationResult = JSON.parse(content);

        // Validate confidence
        if(data.confidence > 1) data.confidence = 1;
        if(data.confidence < 0) data.confidence = 0;

        return data;
    } catch (err) {
      console.error("Image AI identification failed", err);
      return { scientificName: "N",confidence: 0 };
    }
  }
}