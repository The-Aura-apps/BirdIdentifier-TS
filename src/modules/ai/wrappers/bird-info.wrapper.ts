import { Injectable, Logger } from '@nestjs/common';
import { OpenAI } from 'openai';
import { BirdInfo } from '../types';

@Injectable()
export class BirdInfoWrapper {
    private readonly logger = new Logger(BirdInfoWrapper.name);
    private client!: OpenAI;
    private readonly REQUEST_TIMEOUT = 30000; // 30 seconds

    constructor() {
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            this.logger.error('OPENAI_API_KEY·not·set·in·environment·variables');
            throw new Error('OPENAI_API_KEY is required');
        }
        this.client = new OpenAI({
            apiKey,
            timeout: this.REQUEST_TIMEOUT,
        });
        this.logger.log('OpenAI client initialized for bird info fetching');
    }

    /**
     * Fetch detailed bird information with caching
     * @param scientificName The scientific name of the bird
     * @returns BirdInfo object
     */
    async fetchInfo(scientificName: string): Promise<BirdInfo> {
        if (!scientificName || scientificName.trim() === '') {
            throw new Error('Scientific name is required');
        }

        const normalizedName = scientificName.trim();

        this.logger.log(`Fetching bird info from AI: ${normalizedName}`);

        const prompt = `You are an expert-level ornithological database API. You will be given a bird's scientific name via the ${normalizedName} variable. Your task is to provide comprehensive, detailed, and specific information that maps directly to the database schema.

Global Rule: Avoid all vague, high-level, or generic statements. You MUST provide specific details, examples, and quantitative data (like measurements, numbers, and specific months) when available and appropriate.

Return ONLY the raw JSON. Do not include any explanatory text, markdown, or apologies.

{
  "scientificName": "${normalizedName}",
  "description": "Comprehensive physical description including size, shape, plumage colors, distinctive features, sexual dimorphism, and seasonal variations. Be specific about measurements and color patterns.",
  "behavior": "Detailed description of observable behaviors including foraging techniques, social structure, flight patterns, vocalizations, and daily activities. Include specific examples.",
  "nestingHabits": "Specific details about nest construction, location preferences, building materials, and nest appearance. Include height above ground and habitat preferences.",
  "feedingHabits": "Detailed feeding behavior including hunting techniques, feeding times, food handling methods, and foraging strategies.",
  "eggsDescription": "Specific description of egg appearance including color, markings, dimensions, and texture. Include clutch size range and incubation details.",
  "coolFacts": "Array of 3-5 specific, verifiable, and interesting facts that are not commonly known about this species.",
  "size": {
    "lengthCm": {
      "min": "minimum typical length in centimeters",
      "max": "maximum typical length in centimeters"
    },
    "wingspanCm": {
      "min": "minimum wingspan in centimeters", 
      "max": "maximum wingspan in centimeters"
    },
    "weightGrams": {
      "min": "minimum typical weight in grams",
      "max": "maximum typical weight in grams"
    }
  },
  "lifeExpectancyYears": "average lifespan in years in wild, or range if available",
  "taxonomy": {
    "phylum": "Chordata",
    "class": "Aves", 
    "order": "specific taxonomic order",
    "family": "specific taxonomic family",
    "genus": "specific taxonomic genus"
  },
  "conservationStatus": {
    "code": "IUCN conservation code (EX, EW, CR, EN, VU, NT, LC, DD, NE)",
    "fullName": "full conservation status name",
    "description": "specific conservation context and population trends",
    "severityLevel": "number from 1-9 based on threat level",
    "authority": "IUCN"
  },
  "commonNames": [
    {
      "name": "most common English name",
      "language": "en",
      "region": "primary region where this name is used"
    },
    {
      "name": "additional common name if available",
      "language": "en", 
      "region": "region where this name is used"
    }
  ],
  "habitats": [
    "Desert", "Forest", "Grassland", "Savanna", "Scrub", "Subterranean", "Wetlands", "Marine"
  ],
  "birdFoods": [
    {
      "foodName": "specific food item",
      "description": "how and when this food is consumed"
    }
  ],
  "distributions": [
    {
      "month": 1,
      "season": "breeding|non-breeding|year-round|migration",
      "location": {
        "country": "specific country",
        "region": "specific region/state/province",
        "coordinates": {"lat": approximate_latitude, "lng": approximate_longitude}
      },
      "presenceScore": 0.8,
      "description": "specific distribution details for this month",
      "countries": ["country1", "country2"]
    }
  ],
  "mediaSuggestions": [
    {
      "type": "photo|audio|video",
      "caption": "suggested caption describing what should be visible/heard",
      "source": "suggested source or context"
    }
  ]
}

CRITICAL FORMATTING RULES:
- For habitats: ONLY use exact values from this list: ["Desert", "Forest", "Grassland", "Savanna", "Scrub", "Subterranean", "Wetlands", "Marine"]
- For conservationStatus.code: ONLY use: "EX", "EW", "CR", "EN", "VU", "NT", "LC", "DD", "NE"
- For distributions.season: ONLY use: "breeding", "non-breeding", "year-round", "migration"
- For months: use numbers 1-12 (1=January, 12=December)
- All measurements must be in metric units (cm, grams)
- Provide distributions for at least 3 different months showing seasonal patterns
- Include specific countries and regions in distributions
- Be extremely specific about behavioral observations and physical characteristics`;

        try {
            const response = await this.client.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [
                    {
                        role: 'user',
                        content: prompt,
                    },
                ],
                response_format: {
                    type: 'json_object',
                },
            });

            const content = response.choices?.[0]?.message?.content;
            if (!content) {
                this.logger.warn(`No content returned for bird: ${scientificName}`);
                throw new Error('Empty response from OpenAI API');
            }

            // Parse JSON
            let data: BirdInfo;
            try {
                data = JSON.parse(content);
                this.logger.log(`Received bird info: ${JSON.stringify(data, null, 2)}`);
            } catch (parseErr) {
                this.logger.error(`JSON parsing failed for bird: ${normalizedName}`, parseErr);
                throw new Error('Invalid JSON from OpenAI API');
            }

            // Validate required fields
            this.validateBirdInfo(data, normalizedName);

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
            warnings.push('scientificName missing, using input');
        }
        if (!data.commonName) {
            data.commonName = 'Unknown';
            warnings.push('commonName missing');
        }
        // Ensure nested objects exist
        if (!data.features)
            data.features = {
                sizeAndShape: '',
                colorPattern: '',
                billShape: '',
                markings: '',
            };
        if (!data.ecology)
            data.ecology = {
                habitat: '',
                behavior: '',
                diet: '',
            };
        if (!data.geography)
            data.geography = {
                rangeMap: '',
                yearRound: '',
                breeding: '',
                wintering: '',
                migration: '',
                seasonality: '',
            };
        if (!data.education)
            data.education = {
                conservation: '',
                nesting: '',
                eggs: '',
                coolFacts: [],
            };

        // Ensure coolFacts is an array
        if (!Array.isArray(data.education.coolFacts)) {
            data.education.coolFacts = [];
            warnings.push('coolFacts not an array');
        }

        if (warnings.length > 0) {
            warnings.forEach((w) => this.logger.warn(`[${scientificName}] ${w}`));
        }
    }
}
