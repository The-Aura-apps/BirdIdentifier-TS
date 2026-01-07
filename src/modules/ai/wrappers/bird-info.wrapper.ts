import { Injectable, Logger } from '@nestjs/common';
import { OpenAI } from 'openai';
import { BirdInfo } from '../types';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class BirdInfoWrapper {
    private readonly logger = new Logger(BirdInfoWrapper.name);
    private client!: OpenAI;
    private readonly REQUEST_TIMEOUT = 60000; // 60 seconds for comprehensive data

    constructor(private configService: ConfigService) {
        const apiKey =this.configService.get<string>('OPENAI_API_KEY');
        if (!apiKey) {
            this.logger.error('OPENAI_API_KEY not set in environment variables');
            throw new Error('OPENAI_API_KEY is required');
        }
        this.client = new OpenAI({
            apiKey,
            timeout: this.REQUEST_TIMEOUT,
        });
        this.logger.log('OpenAI client initialized for bird info fetching');
    }

    /**
     * Fetch detailed bird information
     * @param scientificName The scientific name of the bird
     * @returns BirdInfo object
     */
    async fetchInfo(scientificName: string): Promise<BirdInfo> {
        if (!scientificName || scientificName.trim() === '') {
            throw new Error('Scientific name is required');
        }

        const normalizedName = scientificName.trim();
        this.logger.log(`Fetching comprehensive bird info from AI: ${normalizedName}`);

        const prompt = `Provide comprehensive data for bird: "${normalizedName}"

Return ONLY valid JSON (no markdown, no explanations):

{
  "scientificName": "${normalizedName}",
  "description": "2-3 paragraphs: appearance, colors, patterns, distinguishing features",
  "behavior": "2-3 paragraphs: social structure, vocalizations, territorial behavior, daily activities",
  "nestingHabits": "Where they nest, materials, season (months), clutch size, incubation days, parental care",
  "feedingHabits": "Foraging techniques, preferred times, hunting methods, seasonal changes",
  "eggsDescription": "Color, size, markings, texture, clutch size (e.g., '3-5 eggs')",
  "coolFacts": ["5 fascinating facts with specific details"],
  "size": {
    "lengthCm": {"min": 0, "max": 0},
    "wingspanCm": {"min": 0, "max": 0},
    "weightGrams": {"min": 0, "max": 0}
  },
  "lifeExpectancyYears": 0,
  "taxonomy": {
    "phylum": "Chordata",
    "class": "Aves",
    "order": "OrderName",
    "family": "FamilyName",
    "genus": "GenusName"
  },
  "conservationStatus": {
    "code": "LC|NT|VU|EN|CR|EW|EX|DD|NE",
    "fullName": "Full name",
    "description": "Brief status and threats",
    "severityLevel": 1-9,
    "authority": "IUCN"
  },
  "commonNames": [
    {"name": "English name", "language": "en", "region": "Region"},
    {"name": "Alt/regional", "language": "en/es/fr", "region": "Region"}
  ],
  "habitats": ["Desert|Forest|Grassland|Savanna|Scrub|Subterranean|Wetlands|Marine"],
  "birdFoods": [
    {"name": "FoodType", "description": "Details"}
  ],
  "distributions": [
    {
      "month": 1-12,
      "season": "breeding|non-breeding|year-round|migration",
      "location": {"country": "Name", "region": "Area", "coordinates": {"lat": 0, "lng": 0}},
      "presenceScore": 0.0-1.0,
      "description": "Behavior during period",
      "countries": ["Country1", "Country2"]
    }
  ]
}

RULES:
- Fill ALL fields with detailed, specific data
- habitats: Use exact values (Desert, Forest, Grassland, Savanna, Scrub, Subterranean, Wetlands, Marine)
- conservationStatus.code: EX(9), EW(8), CR(7), EN(6), VU(5), NT(4), LC(3), DD(2), NE(1)
- distributions: 3-6 entries, presenceScore 0.9+=primary, 0.5-0.8=common, <0.5=rare
- birdFoods: 3-8 items (Seeds, Insects, Fruits, Nectar, Fish, etc.)
- commonNames: Include English + regional/language variants
- Measurements: Actual ranges (length/wingspan in cm, weight in grams)
- All numbers as numbers, not strings`;

        try {
            const response = await this.client.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [
                    {
                        role: 'system',
                        content:
                            'You are a precise ornithological database API that returns comprehensive bird data in exact JSON format. Never include markdown formatting or explanations.',
                    },
                    {
                        role: 'user',
                        content: prompt,
                    },
                ],
                response_format: {
                    type: 'json_object',
                },
                temperature: 0.3, // Lower temperature for more consistent output
            });

            const content = response.choices?.[0]?.message?.content;
            if (!content) {
                this.logger.warn(`No content returned for bird: ${scientificName}`);
                throw new Error('Empty response from OpenAI API');
            }

            // Parse JSON
            let data: any;
            try {
                data = JSON.parse(content);
                this.logger.log(`Received bird info for: ${normalizedName}`);
                this.logger.debug(`Raw data: ${JSON.stringify(data, null, 2)}`);
            } catch (parseErr) {
                this.logger.error(`JSON parsing failed for bird: ${normalizedName}`, parseErr);
                this.logger.error(`Response content: ${content}`);
                throw new Error('Invalid JSON from OpenAI API');
            }

            // Validate and transform the data
            const transformedData = this.validateAndTransform(data, normalizedName);

            this.logger.log(`Bird info successfully fetched: ${normalizedName}`);
            return transformedData;
        } catch (err) {
            this.logger.error(
                `Failed to fetch info for ${normalizedName}: ${err.message}`,
                err.stack,
            );
            throw err;
        }
    }

    /**
     * Validate and transform the API response to match our BirdInfo interface
     */
    private validateAndTransform(data: any, scientificName: string): BirdInfo {
        const warnings: string[] = [];

        // Ensure scientificName
        if (!data.scientificName) {
            data.scientificName = scientificName;
            warnings.push('scientificName missing, using input');
        }

        // Validate habitats
        const validHabitats = [
            'Desert',
            'Forest',
            'Grassland',
            'Savanna',
            'Scrub',
            'Subterranean',
            'Wetlands',
            'Marine',
        ];
        if (data.habitats && Array.isArray(data.habitats)) {
            data.habitats = data.habitats.filter((h: string) => validHabitats.includes(h));
            if (data.habitats.length === 0) {
                warnings.push('No valid habitats found');
            }
        } else {
            data.habitats = [];
            warnings.push('habitats field missing or invalid');
        }

        // Validate conservation status
        const validCodes = ['EX', 'EW', 'CR', 'EN', 'VU', 'NT', 'LC', 'DD', 'NE'];
        if (data.conservationStatus?.code && !validCodes.includes(data.conservationStatus.code)) {
            warnings.push(
                `Invalid conservation code: ${data.conservationStatus.code}, defaulting to NE`,
            );
            data.conservationStatus.code = 'NE';
            data.conservationStatus.fullName = 'Not Evaluated';
            data.conservationStatus.severityLevel = 1;
        }

        // Validate distributions
        const validSeasons = ['breeding', 'non-breeding', 'year-round', 'migration'];
        if (data.distributions && Array.isArray(data.distributions)) {
            data.distributions = data.distributions
                .filter((d: any) => {
                    if (!validSeasons.includes(d.season)) {
                        warnings.push(`Invalid season: ${d.season}`);
                        return false;
                    }
                    if (!d.month || d.month < 1 || d.month > 12) {
                        warnings.push(`Invalid month: ${d.month}`);
                        return false;
                    }
                    return true;
                })
                .map((d: any) => ({
                    ...d,
                    presenceScore: d.presenceScore || 0.5,
                    countries: Array.isArray(d.countries) ? d.countries : [],
                }));
        } else {
            data.distributions = [];
            warnings.push('distributions field missing or invalid');
        }

        // Validate commonNames
        if (
            !data.commonNames ||
            !Array.isArray(data.commonNames) ||
            data.commonNames.length === 0
        ) {
            data.commonNames = [{ name: scientificName, language: 'en', region: 'General' }];
            warnings.push('commonNames missing, using scientific name');
        }

        // Validate birdFoods
        if (!data.birdFoods || !Array.isArray(data.birdFoods)) {
            data.birdFoods = [];
            warnings.push('birdFoods field missing or invalid');
        }

        // Ensure coolFacts is an array
        if (!Array.isArray(data.coolFacts)) {
            data.coolFacts = [];
            warnings.push('coolFacts not an array');
        }

        // Validate size object
        if (!data.size || typeof data.size !== 'object') {
            data.size = {
                lengthCm: { min: 0, max: 0 },
                wingspanCm: { min: 0, max: 0 },
                weightGrams: { min: 0, max: 0 },
            };
            warnings.push('size object missing or invalid');
        }

        // Log warnings
        if (warnings.length > 0) {
            warnings.forEach((w) => this.logger.warn(`[${scientificName}] ${w}`));
        }

        return data as BirdInfo;
    }
}
