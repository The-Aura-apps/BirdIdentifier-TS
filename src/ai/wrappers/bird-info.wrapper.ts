import { Injectable } from "@nestjs/common";
import { OpenAI} from ""; //
import { BirdInfo } from "../types";
import { json } from "stream/consumers";

@Injectable()
export class BirdInfoWrapper {
    private client  = new OpenAI({ apiKey: process.env.OPENAI_API_KEY})


  async fetchInfo(scientificName: string): Promise<BirdInfo> {
  const prompt = `
    Provide detailed JSON data for the bird "${scientificName}".
    Return in this exact structure:

    {
      "scientificName": "k",
      "commonName": "...",
      "photos": { "male": "...", "female": "..." },
      "features": {
        "sizeAndShape": "...",
        "colorPattern": "...",
        "billShape": "...",
        "markings": "..."
      },
      "ecology": {
        "habitat": "...",
        "behavior": "...",
        "diet": "..."
      },
      "geography": {
        "rangeMap": "...",
        "yearRound": "...",
        "breeding": "...",
        "wintering": "...",
        "migration": "...",
        "seasonality": "..."
      },
      "education": {
        "conservation": "...",
        "nesting": "...",
        "eggs": "...",
        "coolFacts": ["...", "..."]
      }
    }
    `;
      const response = await this.client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
    });

  const data = JSON.parse(response.choices[0].message?.content ?? '{}');
  return data as BirdInfo;
  }
}