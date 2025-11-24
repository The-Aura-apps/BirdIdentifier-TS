import { Injectable, Logger } from '@nestjs/common';
import { BirdInfo } from 'src/modules/ai/types';

type MeasurementRange = {
    min: number;
    max: number;
};

interface SourceData {
    success: boolean;
    data: any;
    source: 'OpenAI';
    error?: string;
}

interface MediaItem {
    type: 'photo' | 'audio' | 'video';
    url: string;
    thumbnailUrl?: string;
    attribution?: string;
    license?: string;
    source: string;
    metadata?: any;
}

interface CommonName {
    name: string;
    language: string;
    region?: string;
    isPrimary: boolean;
}

interface Distribution {
    region: string;
    country: string;
    seasonality?: string;
    establishmentMeans?: string;
    status?: string;
}

interface ProcessedBirdData {
    basic: {
        scientificName: string;
        description?: string;
        behavior?: string;
        nestingHabits?: string;
        feedingHabits?: string;
        eggsDescription?: string;
        coolFacts?: string[];
        size?: {
            lengthCm?: MeasurementRange;
            wingspanCm?: MeasurementRange;
            weightGrams?: MeasurementRange;
        };
        lifeExpectancyYears?: number;
    };
    taxonomy?: {
        phylum: string;
        class: string;
        order: string;
        family: string;
        genus: string;
    };
    commonNames: CommonName[];
    media: MediaItem[];
    distributions: Distribution[];
    conservationStatus?: {
        code: string;
        fullName: string;
        description?: string;
        colorHex: string;
        severityLevel: number;
        authority: string;
        isThreatened: boolean;
        year?: number;
    };
    habitats: string[];
    birdFoods: string[];
}

@Injectable()
export class DataProcessorService {
    private readonly logger = new Logger(DataProcessorService.name);

    /**
     * Process and normalize data from multiple sources
     */
    processCollectedData(sources: SourceData[]): ProcessedBirdData {
        const processed: ProcessedBirdData = {
            basic: {
                scientificName: '',
                coolFacts: [],
            },
            commonNames: [],
            media: [],
            distributions: [],
            habitats: [],
            birdFoods: [],
        };

        sources.forEach((source) => {
            if (!source?.success || !source?.data) {
                this.logger.warn(
                    `Skipping source ${source?.source || 'unknown'}: ${source?.error || 'No data'}`,
                );
                return;
            }

            try {
                if (source.source === 'OpenAI') {
                    this.processOpenAiData(source.data, processed);
                } else {
                    //this.logger.warn(`Unknown source type: ${source.source}`);
                }
            } catch (error) {
                this.logger.error(`Error processing ${source.source} data:`, error);
            }
        });

        // Deduplicate data
        processed.commonNames = this.deduplicateCommonNames(processed.commonNames);
        processed.media = this.deduplicateMedia(processed.media);
        processed.distributions = this.deduplicateDistributions(processed.distributions);
        processed.habitats = [...new Set(processed.habitats)];
        processed.birdFoods = [...new Set(processed.birdFoods)];

        return processed;
    }

    /**
     * Process OpenAI generated data (from BirdInfo type)
     */
    private processOpenAiData(data: BirdInfo, processed: ProcessedBirdData): void {
        // Update basic information
        if (data.scientificName && !processed.basic.scientificName) {
            processed.basic.scientificName = data.scientificName;
        }

        if (data.description) {
            processed.basic.description = data.description;
        }

        if (data.behavior) {
            processed.basic.behavior = data.behavior;
        }

        if (data.nestingHabits) {
            processed.basic.nestingHabits = data.nestingHabits;
        }

        if (data.feedingHabits) {
            processed.basic.feedingHabits = data.feedingHabits;
        }

        if (data.eggsDescription) {
            processed.basic.eggsDescription = data.eggsDescription;
        }

        if (data.coolFacts && Array.isArray(data.coolFacts)) {
            if (!processed.basic.coolFacts) {
                processed.basic.coolFacts = [];
            }
            processed.basic.coolFacts.push(...data.coolFacts);
        }

        // Process size measurements
        if (data.size) {
            processed.basic.size = {
                lengthCm: data.size.lengthCm,
                wingspanCm: data.size.wingspanCm,
                weightGrams: data.size.weightGrams,
            };
        }

        if (data.lifeExpectancyYears) {
            processed.basic.lifeExpectancyYears = data.lifeExpectancyYears;
        }

        // Process taxonomy
        if (data.taxonomy) {
            if (!processed.taxonomy) {
                processed.taxonomy = {
                    phylum: '',
                    class: '',
                    order: '',
                    family: '',
                    genus: '',
                };
            }

            processed.taxonomy = {
                ...processed.taxonomy,
                ...data.taxonomy,
            };
        }

        // Process common names
        if (data.commonNames && Array.isArray(data.commonNames)) {
            data.commonNames.forEach((nameObj, index) => {
                processed.commonNames.push({
                    name: nameObj.name,
                    language: nameObj.language || 'en',
                    region: nameObj.region,
                    isPrimary: index === 0,
                });
            });
        }

        // Process habitats
        if (Array.isArray(data.habitats)) {
            const habitats = data.habitats
                .map((h): string => {
                    if (typeof h === 'string') return h;
                    return  '';
                })
                .filter((name) => name.length > 0);

            processed.habitats.push(...habitats);
        }

        // Process foods/diet - BirdFood is a join table, extract food.name
        if (data.birdFoods && Array.isArray(data.birdFoods)) {
            const foodNames = data.birdFoods
                .map((birdFood): string => {
                    // BirdFood has a food property that contains the actual Food entity
                    if (typeof birdFood === 'string') return birdFood;

                    // Access the nested food.name
                    // Need to fix 
                    return ''; // remove  birdFood.food?.name   
                })
                .filter((name) => name.length > 0);

            processed.birdFoods.push(...foodNames);
        }

        // Add note about AI-generated content
        if (!processed.basic.coolFacts) {
            processed.basic.coolFacts = [];
        }
        processed.basic.coolFacts.push(
            'Some information enhanced by AI to provide comprehensive details.',
        );
    }

    /**
     * Deduplicate common names
     */
    private deduplicateCommonNames(names: CommonName[]): CommonName[] {
        const seen = new Set<string>();
        return names.filter((name) => {
            const key = `${name.name}-${name.language}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    }

    /**
     * Deduplicate media entries
     */
    private deduplicateMedia(media: MediaItem[]): MediaItem[] {
        const seen = new Set<string>();
        return media.filter((item) => {
            if (seen.has(item.url)) return false;
            seen.add(item.url);
            return true;
        });
    }

    /**
     * Deduplicate distributions
     */
    private deduplicateDistributions(distributions: Distribution[]): Distribution[] {
        const seen = new Set<string>();
        return distributions.filter((dist) => {
            const key = `${dist.country}-${dist.region}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    }
}
