import { Injectable, Logger } from "@nestjs/common";
import { OpenAI } from "openai"; //
import { BirdInfo } from "../types";
import { json } from "stream/consumers";

@Injectable()
export class BirdInfoWrapper {
  private client: OpenAI;

  constructor(client?: OpenAI) {
    if (client) {
      this.client = client;
      Logger.log("Using injected OpenAI client.");
    } else {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        Logger.error("OPENAI_API_KEY is not set. Bird info fetching will fail!");
        throw new Error("OPENAI_API_KEY not found in environment variables.");
      }
      this.client = new OpenAI({ apiKey });
      Logger.log("OpenAI client initialized successfully.");
    }
  }

  async fetchInfo(scientificName: string): Promise<BirdInfo> {
    const prompt = `
    Provide detailed information about the bird "${scientificName}" in strict JSON format.
    Structure:
    {
      "scientificName": "...",
      "commonName": "...",
      "photos": { "male": "...", "female": "..." },
      "features": { "sizeAndShape": "...", "colorPattern": "...", "billShape": "...", "markings": "..." },
      "ecology": { "habitat": "...", "behavior": "...", "diet": "..." },
      "geography": { "rangeMap": "...", "yearRound": "...", "breeding": "...", "wintering": "...", "migration": "...", "seasonality": "..." },
      "education": { "conservation": "...", "nesting": "...", "eggs": "...", "coolFacts": ["...", "..."] }
    }
    Ensure valid JSON, do not include explanations.
  `;
    try {
      const response = await this.client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
      });

      const content = response.choices?.[0]?.message?.content;
      if (!content) {
        Logger.warn(`No content returned for bird: ${scientificName}`);
        throw new Error('Empty response from OpenAI API');
      }

      let data: BirdInfo;
      try {
        data = JSON.parse(content);
      } catch (parseErr) {
        Logger.error(`JSON parsing failed for bird: ${scientificName}`, parseErr);
        throw new Error('Invalid JSON from OpenAI API');
      }

      // basic Partial validation
      if (!data.scientificName || !data.commonName) {
        Logger.warn(`Incomplete bird info for: ${scientificName}`);
      }

      return data;

    } catch (err) {
      Logger.error(`Failed to fetch info for ${scientificName}`, err);
      throw err;
    }
  }
}