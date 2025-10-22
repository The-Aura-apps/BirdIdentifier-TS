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
import { Result } from 'pg';

// Types for API responses
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
    data?: any;
    error?: string;
}
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
        // Configure your API sources here
        this.apiSources.push(
            {
                name: 'OpenAI',
                url: 'https://api.openai.com/v1',
                apiKey: this.configService.get('OPENAI_API_KEY'),
                priority: 1,
                model: this.configService.get('OPENAI_MODEL') || '  ', // optional custom property
            },
            // {
            //     name: 'eBird',
            //     url: 'https://api.ebird.org/v2',
            //     apiKey: this.configService.get('EBIRD_API_KEY'),
            //     priority: 2,
            // },
            // {
            //     name: 'iNaturalist',
            //     url: 'https://api.inaturalist.org/v1',
            //     priority: 2,
            // },
            // {
            //     name: 'GBIF',
            //     url: 'https://api.gbif.org/v1',
            //     priority: 3,
            // },
            // {
            //     name: 'Xeno-canto',
            //     url: 'https://www.xeno-canto.org/api/2',
            //     priority: 4,
            // },
        );
    }

    /**
     * Collect data for a bird from all configured APIs
     */
    async collectBirdData(scientificName: string): Promise<{
        birdId: number;
        results: CollectionResult[];
    }> {
        this.logger.log(`Starting data collecting fro: ${scientificName}`);

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

            let data: any;

            switch (source.name) {
                case 'OpenAi':
                    data = await this.collectFromOpenAi(scientificName, source);
                    break;
                case 'eBird':
                    // data = await this.collectFromEbird(scientificName, source);
                    break;
                case 'iNaturalist':
                    //   data = await this.collectFromINaturalist(
                    //      scientificName,
                    //      source,
                    //  );
                    break;
                case 'GBIF':
                    //  data = await this.collectFromGBIF(scientificName, source);
                    break;
                case 'Xeno-canto':
                    // data = await this.collectFromXenoCanto(
                    //     scientificName,
                    //     source,
                    // );
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
            this.logger.error(
                `Failed to collect from ${source.name}: ${error.message}`,
            );

            return {
                source: source.name,
                success: false,
                error: error.message,
            };
        }
    }

    /**
     * Collect data from eBird API
     */
    private async collectFromOpenAi(){}
}
