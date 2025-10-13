import { Injectable, Logger } from "@nestjs/common";
import { OpenAI } from "openai";
import { BirdInfo } from "../types";

@Injectable()
export class BirdInfoWrapper {
    private readonly logger = new Logger(BirdInfoWrapper.name);
    private client: OpenAI;
    private readonly REQUEST_TIMEOUT = 30000; // 30 seconds

    //$$
    // Simple in-memory cache for MVP (consider Redis for production)
    // private cache = new Map<string, { data: BirdInfo; timestamp: number }>();
    //private readonly CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

    constructor() {
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            this.logger.error(
                "OPENAI_API_KEY not set in environment variables",
            );
            throw new Error("OPENAI_API_KEY is required");
        }
        this.client = new OpenAI({ apiKey, timeout: this.REQUEST_TIMEOUT });
        this.logger.log("OpenAI client initialized for bird info fetching");
    }

    /**
     * Fetch detailed bird information with caching
     * @param scientificName The scientific name of the bird
     * @returns BirdInfo object
     */
    async fetchInfo(scientificName: string): Promise<BirdInfo> {
        if (!scientificName || scientificName.trim() === "") {
            throw new Error("Scientific name is required");
        }

        const normalizedName = scientificName.trim();

        // // Check cache first
        // const cached = this.getCached(normalizedName);
        // if (cached) {
        //   this.logger.log(`Cache hit for: ${normalizedName}`);
        //   return cached;
        // }

        this.logger.log(`Fetching bird info from AI: ${normalizedName}`);

        const prompt = `Provide detailed information about the bird species "${normalizedName}" in strict JSON format.

Return ONLY valid JSON with this structure (no explanations):
{
  "scientificName": "${normalizedName}",
  "commonName": "string",
  "photos": {
    "male": "URL or empty string",
    "female": "URL or empty string"
  },
  "features": {
    "sizeAndShape": "string",
    "colorPattern": "string",
    "billShape": "string",
    "markings": "string"
  },
  "ecology": {
    "habitat": "string",
    "behavior": "string",
    "diet": "string"
  },
  "geography": {
    "rangeMap": "string",
    "yearRound": "string",
    "breeding": "string",
    "wintering": "string",
    "migration": "string",
    "seasonality": "string"
  },
  "education": {
    "conservation": "string",
    "nesting": "string",
    "eggs": "string",
    "coolFacts": ["fact1", "fact2", "fact3"]
  }
}

Important:
- All fields must be present (use empty strings if unknown)
- coolFacts must be an array of strings
- Return only JSON, no markdown or explanations`;

        try {
            const response = await this.client.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [{ role: "user", content: prompt }],
                response_format: { type: "json_object" },
            });

            const content = response.choices?.[0]?.message?.content;
            if (!content) {
                Logger.warn(`No content returned for bird: ${scientificName}`);
                throw new Error("Empty response from OpenAI API");
            }

            // Parse JSON
            let data: BirdInfo;
            try {
                data = JSON.parse(content);
                this.logger.log(
                    `Received bird info: ${JSON.stringify(data, null, 2)}`,
                );
            } catch (parseErr) {
                Logger.error(
                    `JSON parsing failed for bird: ${normalizedName}`,
                    parseErr,
                );
                throw new Error("Invalid JSON from OpenAI API");
            }

            // Validate required fields
            this.validateBirdInfo(data, normalizedName);

            // // Cache the result
            // this.cache.set(normalizedName, {
            //     data,
            //     timestamp: Date.now(),
            // });
            this.logger.log(`Bird info fetched and cached: ${normalizedName}`);
            return data;
        } catch (err) {
            this.logger.error(
                `Failed to fetch info for ${normalizedName}: ${err.message}`,
                err.stack,
            );
            throw err;
        }
    }

    /**
     * Validate bird info structure
     * @param data BirdInfo data to validate
     * @param scientificName Fallback scientific name
     */
    private validateBirdInfo(data: any, scientificName: string): void {
        const warnings: string[] = [];

        if (!data.scientificName) {
            data.scientificName = scientificName; // Fallback
            warnings.push("scientificName missing, using input");
        }
        if (!data.commonName) {
            data.commonName = "Unknown";
            warnings.push("commonName missing");
        }
        // Ensure nested objects exist
        if (!data.photos) data.photos = { male: "", female: "" };
        if (!data.features)
            data.features = {
                sizeAndShape: "",
                colorPattern: "",
                billShape: "",
                markings: "",
            };
        if (!data.ecology)
            data.ecology = { habitat: "", behavior: "", diet: "" };
        if (!data.geography)
            data.geography = {
                rangeMap: "",
                yearRound: "",
                breeding: "",
                wintering: "",
                migration: "",
                seasonality: "",
            };
        if (!data.education)
            data.education = {
                conservation: "",
                nesting: "",
                eggs: "",
                coolFacts: [],
            };

        // Ensure coolFacts is an array
        if (!Array.isArray(data.education.coolFacts)) {
            data.education.coolFacts = [];
            warnings.push("coolFacts not an array");
        }

        if (warnings.length > 0) {
            this.logger.warn(
                `Incomplete bird info for ${scientificName}: ${warnings.join(", ")}`,
            );
        }
    }

    /**
     * Get cached bird info if not expired
     * @param scientificName Name to check in cache
     * @returns Cached BirdInfo or null
     */
    // private getCached(scientificName: string): BirdInfo | null {
    //     const cached = this.cache.get(scientificName);
    //     if (!cached) return null;
    //     if (Date.now() - cached.timestamp > this.CACHE_TTL) {
    //         this.cache.delete(scientificName);
    //         return null;
    //     }
    //     return cached.data;
    // }
}
