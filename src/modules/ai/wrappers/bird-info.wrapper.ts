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

        const prompt = `You are an expert ornithological database API. Provide comprehensive, detailed information about the bird species: "${normalizedName}"

CRITICAL INSTRUCTIONS:
1. Return ONLY valid JSON - no markdown, no explanations, no apologies
2. Be specific and detailed - avoid vague statements
3. Provide actual measurements, dates, and quantitative data
4. Use ONLY the allowed values for enums (habitats, conservation codes, seasons)
5. Fill ALL fields with relevant data - do not leave fields empty unless truly unknown

Required JSON Structure:
{
  "scientificName": "${normalizedName}",
  "description": "2-3 detailed paragraphs describing the bird's appearance, distinguishing features, and general characteristics. Be specific about colors, patterns, and physical traits.",
  "behavior": "2-3 detailed paragraphs about behavior patterns, social structure, vocalizations, territorial behavior, and daily activities. Include specific examples.",
  "nestingHabits": "Detailed description of nesting behavior: where they nest, nest construction materials and methods, nesting season (specific months), clutch size, incubation period in days, and parental care details.",
  "feedingHabits": "Detailed description of feeding behavior: foraging techniques, preferred feeding times, hunting/gathering methods, and seasonal dietary changes.",
  "eggsDescription": "Detailed description of eggs: color, size, markings, texture, typical clutch size (e.g., '3-5 eggs'), and any unique characteristics.",
  "coolFacts": ["Fascinating fact 1 with specific details", "Interesting behavior or adaptation with examples", "Unique characteristic or record", "Cultural or historical significance", "Conservation story or success"],
  "size": {
    "lengthCm": {
      "min": 00.0,
      "max": 00.0
    },
    "wingspanCm": {
      "min": 00.0,
      "max": 00.0
    },
    "weightGrams": {
      "min": 00.0,
      "max": 00.0
    }
  },
  "lifeExpectancyYears": 0.0,
  "taxonomy": {
    "phylum": "Chordata",
    "class": "Aves",
    "order": "Actual order name",
    "family": "Actual family name",
    "genus": "Actual genus name"
  },
  "conservationStatus": {
    "code": "MUST BE ONE OF: LC,NT,VU,EN,CR,EW,EX,DD,NE",
    "fullName": "Full conservation status name",
    "description": "Brief description of conservation status and main threats",
    "severityLevel": LC=1, NT=2, VU=3, DD=4, EN=5, NE=6, CR=7, EW=8, EX=9,
    "authority": "IUCN"
  },
  "commonNames": [
    {
      "name": "Primary English common name",
      "language": "en",
      "region": "General or specific region"
    },
    {
      "name": "Alternative common name if exists",
      "language": "en",
      "region": "Regional variant"
    },
    {
      "name": "Common name in another language if applicable",
      "language": "es/fr/de/etc",
      "region": "Country or region"
    },
    {
      "name": "Common name in another language if applicable",
      "language": "es/fr/de/etc",
      "region": "Country or region"
    },
    {
      "name": "Common name in another language if applicable",
      "language": "es/fr/de/etc",
      "region": "Country or region"
    }
  ],
  "habitats": ["Select from: Desert, Forest, Grassland, Savanna, Scrub, Subterranean, Wetlands, Marine - include all that apply"],
  "birdFoods": [
    {
      "name": "",
      "description": ""
    },
    {
      "name": "",
      "description": ""
    },

  ],
  "distributions": [
    {
      "month": 1,
      "season": "MUST BE ONE OF: breeding, non-breeding, year-round, or migration",
      "location": {
        "country": "Primary country name",
        "region": "Specific region or state",
        "coordinates": {
          "lat": 00.00,
          "lng": 00.00
        }
      },
      "presenceScore": 0.0,
      "description": "Describe presence and behavior during this period",
      "countries": ["Country1", "Country2", "Country3"]
    }
  ]
}

SPECIFIC FIELD REQUIREMENTS:

**habitats**: ONLY use these exact values (select all that apply):
- "Desert" - arid, sandy, or rocky dry regions
- "Forest" - wooded areas (deciduous, coniferous, tropical)
- "Grassland" - prairies, meadows, open grass areas
- "Savanna" - tropical grasslands with scattered trees
- "Scrub" - brushland, chaparral, shrubland
- "Subterranean" - caves, burrows, underground
- "Wetlands" - marshes, swamps, bogs, wetlands
- "Marine" - coastal, oceanic, or marine areas

**conservationStatus.code**: ONLY use these IUCN codes:
- EX = Extinct (severityLevel: 9)
- EW = Extinct in the Wild (severityLevel: 8)
- CR = Critically Endangered (severityLevel: 7)
- EN = Endangered (severityLevel: 6)
- VU = Vulnerable (severityLevel: 5)
- NT = Near Threatened (severityLevel: 4)
- LC = Least Concern (severityLevel: 3)
- DD = Data Deficient (severityLevel: 2)
- NE = Not Evaluated (severityLevel: 1)

**distributions.season**: ONLY use these values:
- "breeding" - nesting/reproduction period
- "non-breeding" - outside breeding season
- "year-round" - resident year-round
- "migration" - during migration passages

**distributions requirements**:
- Provide at least 3-6 distribution entries covering different months
- Include breeding range, wintering range, and migration routes if applicable
- presenceScore should be 0.0 to 1.0 (0.9+ = primary range, 0.5-0.8 = common, 0.1-0.4 = rare)
- Coordinates should be approximate center of range
- Include multiple countries where the bird is found

**birdFoods requirements**:
- Include 3-8 food items
- Common food categories: Seeds, Insects, Fruits, Nectar, Small Mammals, Fish, Carrion, Berries, Nuts, Aquatic Plants, Crustaceans, Mollusks, Worms, Grains, Vegetation
- Be specific about species preferences and foraging behavior

**commonNames requirements**:
- Include at least the primary English common name
- Add regional variants if they exist
- Include names in other languages if commonly used
- Specify the region where each name is used

**Size measurements**:
- Always provide ranges (min and max)
- Length = bill tip to tail tip in cm
- Wingspan = tip to tip with wings extended in cm
- Weight in grams
- If exact ranges unknown, provide reasonable estimates based on similar species

Return ONLY the JSON object. Ensure all numeric values are numbers, not strings.`;

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
