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

        const prompt = `hi`;

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
