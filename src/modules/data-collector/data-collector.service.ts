import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ConfigService } from '@nestjs/config';

// Existing services
import { BirdDistributionService } from '../bird/bird-distribution/bird-distribution.service';
import { BirdsService } from '../bird/birds/birds.service';
import { CommonNamesService } from '../bird/common-names/common-names.service';
import { ConservationStatusService } from '../bird/conservation-status/conservation-status.service';
import { TaxonomyService } from '../bird/taxonomy/taxonomy.service';
import { MediaService } from '../media/media.service';
import { FoodService } from '../bird/foods/foods.service';
import { HabitatService } from '../bird/habitats/habitats.service';

// API Source Configuration
interface ApiSource {
    name: string;
    url: string;
    apiKey?: string;
    priority: number;
    model?: string;
}

interface CollectionResult {
    source: string;
    success: boolean;
    data?: OpenAIData;
    error?: string;
}

// OpenAI Types
interface OpenAIBirdDescription {
    description: string;
    summary: string;
    characteristics: {
        size: string;
        color: string;
        beak_type: string;
        distinctive_features: string[];
    };
    behavior: {
        feeding: string;
        social_behavior: string;
        migration: string;
        vocalization: string;
    };
    habitat: {
        primary: string[];
        regions: string[];
        nesting: string;
    };
    diet: string[];
    conservation: {
        status: string;
        threats: string[];
        conservation_efforts: string[];
    };
    interesting_facts: string[];
}

interface OpenAIData {
    description: OpenAIBirdDescription;
    generatedAt: string;
    model: string;
}

@Injectable()
export class DataCollectorService {
    private readonly logger = new Logger(DataCollectorService.name);
    private readonly apiSources: ApiSource[] = [];

    constructor(
        private readonly httpService: HttpService,
        private readonly configService: ConfigService,
        private readonly birdsService: BirdsService,
        private readonly mediaService: MediaService,
        private readonly taxonomyService: TaxonomyService,
        private readonly commonNamesService: CommonNamesService,
        private readonly distributionService: BirdDistributionService,
        private readonly conservationService: ConservationStatusService,
        private readonly habitatsService: HabitatService,
        private readonly foodsService: FoodService,
    ) {
        this.initializeApiSources();
    }

    private initializeApiSources() {
        this.apiSources.push({
            name: 'OpenAI',
            url: 'https://api.openai.com/v1',
            apiKey: this.configService.get('OPENAI_API_KEY'),
            priority: 1,
            model: this.configService.get('OPENAI_MODEL') || 'gpt-3.5-turbo',
        });
    }

    /**
     * Collect data for a bird from all configured APIs
     */
    async collectBirdData(scientificName: string): Promise<{
        birdId: number;
        results: CollectionResult[];
    }> {
        this.logger.log(`Starting data collection for: ${scientificName}`);

        // Check if bird exists or create it
        let bird = await this.birdsService.findByScientificName(scientificName);
        if (!bird) {
            bird = await this.birdsService.create({ scientificName });
        }

        const results: CollectionResult[] = [];

        // Collect from each source in parallel
        const collectionPromises = this.apiSources.map((source) =>
            this.collectFromSource(source, scientificName, bird.id),
        );

        const collectionResults = await Promise.allSettled(collectionPromises);

        collectionResults.forEach((result, index) => {
            if (result.status === 'fulfilled') {
                results.push(result.value);
            } else {
                results.push({
                    source: this.apiSources[index].name,
                    success: false,
                    error: result.reason?.message || 'Unknown error',
                });
            }
        });

        // Store collected data
        await this.storeCollectedData(bird.id, results);

        return {
            birdId: bird.id,
            results,
        };
    }
    /**
     * Collect data from a specific API source
     */
    private async collectFromSource(
        source: ApiSource,
        scientificName: string,
        birdId: number,
    ): Promise<CollectionResult> {
        try {
            this.logger.log(
                `Collecting from ${source.name} for ${scientificName}`,
            );

            let data: OpenAIData;

            switch (source.name) {
                case 'OpenAI':
                    data = await this.collectFromOpenAI(scientificName, source);
                    break;
                default:
                    throw new Error(`Unknown source: ${source.name}`);
            }

            return {
                source: source.name,
                success: true,
                data,
            };
        } catch (error) {
            const errorMessage =
                error instanceof Error ? error.message : 'Unknown error';
            this.logger.error(
                `Failed to collect from ${source.name}: ${errorMessage}`,
            );

            return {
                source: source.name,
                success: false,
                error: error.message,
            };
        }
    }

    /**
     * Collect data from OpenAI API
     */
    private async collectFromOpenAI(
        scientificName: string,
        source: ApiSource,
    ): Promise<OpenAIData> {
        const headers = {
            'Authorization': `Bearer ${source.apiKey}`,
            'Content-Type': 'application/json',
        };

        const prompt = ` HI `;

        const requestBody = {
            model: source.model || '  ',
            messages: [
                {
                    role: 'system',
                    content:
                        'You are an expert ornithologist. Provide accurate, scientific information about bird species in structured JSON format.',
                },
                {
                    role: 'user',
                    content: prompt,
                },
            ],
            temperature: 0.3,
            max_tokens: 2000,
        };

        const url = `${source.url}/chat/completions`;
        const { data } = await firstValueFrom(
            this.httpService.post(url, requestBody, { headers }),
        );

        if (!data.choices || data.choices.length === 0) {
            throw new Error('No response from OpenAI');
        }

        const responseContent = data.choices[0].message.content;

        try {
            const descriptionData = JSON.parse(
                responseContent,
            ) as OpenAIBirdDescription;

            return {
                description: descriptionData,
                generatedAt: new Date().toISOString(),
                model: data.model,
            };
        } catch (parseError) {
            this.logger.warn(
                'Failed to parse OpenAI response as JSON, using raw text',
            );

            // Fallback: return the raw text in a structured format
            return {
                description: {
                    description: responseContent,
                    summary: responseContent.substring(0, 200) + '...',
                    characteristics: {
                        size: '',
                        color: '',
                        beak_type: '',
                        distinctive_features: [],
                    },
                    behavior: {
                        feeding: '',
                        social_behavior: '',
                        migration: '',
                        vocalization: '',
                    },
                    habitat: {
                        primary: [],
                        regions: [],
                        nesting: '',
                    },
                    diet: [],
                    conservation: {
                        status: '',
                        threats: [],
                        conservation_efforts: [],
                    },
                    interesting_facts: [],
                },
                generatedAt: new Date().toISOString(),
                model: data.model,
            };
        }
    }

    /**
     * Store collected data in appropriate tables
     */
    private async storeCollectedData(
        birdId: number,
        results: CollectionResult[],
    ): Promise<void> {
        this.logger.log(`Storing collected data for bird ${birdId}`);

        for (const result of results) {
            if (!result.success || !result.data) continue;

            try {
                switch (result.source) {
                    case 'OpenAI':
                        await this.storeOpenAIData(
                            birdId,
                            result.data as OpenAIData,
                        );
                        break;
                }
            } catch (error) {
                this.logger.error(
                    `Failed to store data from ${result.source}: ${error.message}`,
                );
            }
        }
    }

    /**
     * Store OpenAI generated data
     */
    private async storeOpenAIData(
        // birdScientificName
        birdId: number,
        data: OpenAIData,
    ): Promise<void> {
        const openAIData = data;
        const Odesc = openAIData.description;

        // Update bird description
        if (openAIData.description) {
            await this.birdsService.update(birdId.toString(), {
                description: Odesc.description,
            });
        }

        // Store habitat information
        if (Odesc.habitat) {
            const regionsStr =
                Odesc.habitat.regions?.join(', ') || 'Various regions';
            for (const habitatName of Odesc.habitat.primary || []) {
                let habitat =
                    await this.habitatsService.findByName(habitatName);
                if (!habitat) {
                    habitat = await this.habitatsService.create({
                        name: habitatName,
                        description: `Primary habitat: ${habitatName} in ${regionsStr}`,
                    });
                }
                await this.birdsService.addHabitat(birdId, habitat.id);
            }

            // Handle nesting as bird.nestingHabits (aligns with CreateBirdDto)
            if (Odesc.habitat.nesting) {
                await this.birdsService.update(birdId.toString(), {
                    nestingHabits: Odesc.habitat.nesting,
                });
            }
        }

        // Store diet information
        if (Odesc.diet && Odesc.diet.length > 0) {
            for (const foodItem of Odesc.diet) {
                let food = await this.foodsService.findByName(foodItem);
                if (!food) {
                    await this.foodsService.create({
                        name: foodItem,
                        description: `Part of natural diet`,
                    });
                }
                await this.birdsService.addFood(birdId, {
                    foodId: food.id,
                    isActive: true, // Default to active as per DTO
                });
            }

        // Optionally set bird.feedingHabits for summary (aligns with CreateBirdDto)
        await this.birdsService.update(birdId.toString(), {
            feedingHabits: `Diet includes: ${Odesc.diet.join(', ')}`,
        });
    }

        // Store conservation information  // NO Need Any More
        // if (Odesc.conservation) {
        //     const conservation = Odesc.conservation;

        //     if (conservation.status) {
        //         const status = await this.conservationService.findOrCreate({
        //             code: conservation.status,
        //             authority: 'OpenAI Generated',
        //             description: `Threats: ${conservation.threats?.join(', ') || 'Unknown'}. Conservation efforts: ${conservation.conservation_efforts?.join(', ') || 'Unknown'}`,
        //         });
        //         await this.birdsService.update(birdId.toString(), {
        //             conservationStatusId: status.id,
        //         });
        //     }
        // }

        // Store interesting facts as metadata or additional description
        if (
            Odesc.interesting_facts &&
            Odesc.interesting_facts.length > 0
        ) {
            const currentBird = await this.birdsService.findOne(
                birdId.toString(),
            );
            const updatedDescription = currentBird.description
                ? `${currentBird.description}\n\nInteresting Facts:\n- ${Odesc.interesting_facts.join('\n- ')}`
                : `Interesting Facts:\n- ${Odesc.interesting_facts.join('\n- ')}`;

            await this.birdsService.update(birdId.toString(), {
                description: updatedDescription,
            });
        }

        this.logger.log(
            `Successfully stored OpenAI generated data for bird ${birdId} ,`,
        );
    }
}
