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
     * Collect data from OpenAI API
     */
    private async collectFromOpenAi(
        scientificName: string,
        source: ApiSource,
    ): Promise<any> {
        const headers = {
            'X-eBirdApiToken': source.apiKey,
        };

        // Get taxonomy
        const taxonomyUrl = `${source.url}/ref/taxonomy/ebird`;
        const { data: taxonomy } = await firstValueFrom(
            this.httpService.get(taxonomyUrl, {
                headers,
                params: { fmt: 'json', species: scientificName },
            }),
        );

        // Get recent observations
        const obsUrl = `${source.url}/data/obs/recent`;
        const { data: observations } = await firstValueFrom(
            this.httpService.get(obsUrl, {
                headers,
                params: { sci: scientificName, maxResults: 100 },
            }),
        );

        return {
            taxonomy,
            observations,
            distribution:
                this.extractDistributionFromObservations(observations),
        };
    }

    /**
     * Collect data from eBird API
     */
    // private async collectFromEbird(
    //     scientificName: string,
    //     source: ApiSource,
    // ): Promise<any> {
    //     const headers = {
    //         'X-eBirdApiToken': source.apiKey,
    //     };

    //     // Get taxonomy
    //     const taxonomyUrl = `${source.url}/ref/taxonomy/ebird`;
    //     const { data: taxonomy } = await firstValueFrom(
    //         this.httpService.get(taxonomyUrl, {
    //             headers,
    //             params: { fmt: 'json', species: scientificName },
    //         }),
    //     );

    //     // Get recent observations
    //     const obsUrl = `${source.url}/data/obs/recent`;
    //     const { data: observations } = await firstValueFrom(
    //         this.httpService.get(obsUrl, {
    //             headers,
    //             params: { sci: scientificName, maxResults: 100 },
    //         }),
    //     );

    //     return {
    //         taxonomy,
    //         observations,
    //         distribution:
    //             this.extractDistributionFromObservations(observations),
    //     };
    // }

    /**
     * Collect data from iNaturalist API
     */
    // private async collectFromINaturalist(
    //     scientificName: string,
    //     source: ApiSource,
    // ): Promise<any> {
    //     // Search for taxon
    //     const taxonUrl = `${source.url}/taxa`;
    //     const { data: taxonData } = await firstValueFrom(
    //         this.httpService.get(taxonUrl, {
    //             params: { q: scientificName, is_active: true },
    //         }),
    //     );

    //     if (taxonData.results.length === 0) {
    //         throw new Error('No data found on iNaturalist');
    //     }

    //     const taxon = taxonData.results[0];
    //     const taxonId = taxon.id;

    //     // Get observations
    //     const obsUrl = `${source.url}/observations`;
    //     const { data: observations } = await firstValueFrom(
    //         this.httpService.get(obsUrl, {
    //             params: {
    //                 taxon_id: taxonId,
    //                 quality_grade: 'research',
    //                 per_page: 100,
    //             },
    //         }),
    //     );

    //     // Get photos
    //     const photos = observations.results
    //         .filter((obs) => obs.photos && obs.photos.length > 0)
    //         .flatMap((obs) => obs.photos)
    //         .slice(0, 10); // Limit to 10 photos

    //     return {
    //         taxon,
    //         observations: observations.results,
    //         photos,
    //         conservationStatus: taxon.conservation_status,
    //         commonNames: taxon.common_names,
    //     };
    // }

    /**
     * Collect data from GBIF API
     */
    // private async collectFromGBIF(
    //     scientificName: string,
    //     source: ApiSource,
    // ): Promise<any> {
    //     // Search for species
    //     const speciesUrl = `${source.url}/species/match`;
    //     const { data: speciesMatch } = await firstValueFrom(
    //         this.httpService.get(speciesUrl, {
    //             params: { name: scientificName },
    //         }),
    //     );

    //     if (!speciesMatch.usageKey) {
    //         throw new Error('Species not found in GBIF');
    //     }

    //     const speciesKey = speciesMatch.usageKey;

    //     // Get species details
    //     const detailsUrl = `${source.url}/species/${speciesKey}`;
    //     const { data: details } = await firstValueFrom(
    //         this.httpService.get(detailsUrl),
    //     );

    //     // Get vernacular names
    //     const vernacularUrl = `${source.url}/species/${speciesKey}/vernacularNames`;
    //     const { data: vernacularNames } = await firstValueFrom(
    //         this.httpService.get(vernacularUrl),
    //     );

    //     // Get distributions
    //     const distributionUrl = `${source.url}/species/${speciesKey}/distributions`;
    //     const { data: distributions } = await firstValueFrom(
    //         this.httpService.get(distributionUrl),
    //     );

    //     return {
    //         species: details,
    //         vernacularNames: vernacularNames.results,
    //         distributions: distributions.results,
    //     };
    // }

    /**
     * Collect audio data from Xeno-canto
     */
    // private async collectFromXenoCanto(
    //     scientificName: string,
    //     source: ApiSource,
    // ): Promise<any> {
    //     const url = `${source.url}/recordings`;
    //     const { data } = await firstValueFrom(
    //         this.httpService.get(url, {
    //             params: { query: scientificName },
    //         }),
    //     );

    //     if (data.numRecordings === 0) {
    //         throw new Error('No recordings found on Xeno-canto');
    //     }

    //     // Get top quality recordings
    //     const recordings = data.recordings
    //         .sort((a, b) => b.q.localeCompare(a.q)) // Sort by quality
    //         .slice(0, 5); // Get top 5

    //     return {
    //         recordings,
    //         totalRecordings: data.numRecordings,
    //     };
    // }

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
                    case 'eBird':
                        await this.storeEbirdData(birdId, result.data);
                        break;
                    case 'iNaturalist':
                        await this.storeINaturalistData(birdId, result.data);
                        break;
                    case 'GBIF':
                        await this.storeGBIFData(birdId, result.data);
                        break;
                    case 'Xeno-canto':
                        await this.storeXenoCantoData(birdId, result.data);
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
     * Store eBird data
     */
    private async storeEbirdData(birdId: number, data: any): Promise<void> {
        // Store taxonomy if available
        if (data.taxonomy && data.taxonomy.length > 0) {
            const taxon = data.taxonomy[0];
            await this.taxonomyService.createOrUpdate(birdId, {
                kingdom: 'Animalia',
                phylum: 'Chordata',
                class: 'Aves',
                order: taxon.order,
                family: taxon.familySciName,
                genus: taxon.genus,
                species: taxon.sciName,
            });
        }

        // Store distribution data
        if (data.distribution) {
            for (const dist of data.distribution) {
                await this.distributionService.createOrUpdate(birdId, {
                    region: dist.region,
                    country: dist.country,
                    seasonality: dist.seasonality,
                    establishmentMeans: 'native',
                });
            }
        }
    }
    /**
     * Store iNaturalist data
     */
    // private async storeINaturalistData(
    //     birdId: number,
    //     data: any,
    // ): Promise<void> {
    //     // Store common names
    //     if (data.commonNames && data.commonNames.length > 0) {
    //         for (const name of data.commonNames) {
    //             await this.commonNamesService.createOrUpdate(birdId, {
    //                 name: name.name,
    //                 language: name.lexicon,
    //                 region: name.place_guess,
    //                 isPrimary: name.is_default,
    //             });
    //         }
    //     }

    //     // Store photos as media
    //     if (data.photos && data.photos.length > 0) {
    //         for (const photo of data.photos) {
    //             await this.mediaService.create({
    //                 birdId,
    //                 mediaType: 'photo',
    //                 url: photo.url,
    //                 thumbnailUrl: photo.small_url,
    //                 attribution: photo.attribution,
    //                 license: photo.license_code,
    //                 source: 'iNaturalist',
    //             });
    //         }
    //     }

    //     // Store conservation status
    //     if (data.conservationStatus) {
    //         const status = await this.conservationService.findOrCreate({
    //             status: data.conservationStatus.status,
    //             authority: data.conservationStatus.authority,
    //         });
    //         await this.birdsService.update(birdId.toString(), {
    //             conservationStatusId: status.id,
    //         });
    //     }
    // }

    /**
     * Store GBIF data
     */
    // private async storeGBIFData(birdId: number, data: any): Promise<void> {
    //     // Update bird with additional information
    //     if (data.species) {
    //         await this.birdsService.update(birdId.toString(), {
    //             description: data.species.description,
    //         });
    //     }

    //     // Store vernacular names
    //     if (data.vernacularNames && data.vernacularNames.length > 0) {
    //         for (const name of data.vernacularNames) {
    //             await this.commonNamesService.createOrUpdate(birdId, {
    //                 name: name.vernacularName,
    //                 language: name.language,
    //                 region: name.country,
    //                 isPrimary: name.preferred || false,
    //             });
    //         }
    //     }

    //     // Store distributions
    //     if (data.distributions && data.distributions.length > 0) {
    //         for (const dist of data.distributions) {
    //             await this.distributionService.createOrUpdate(birdId, {
    //                 region: dist.locality,
    //                 country: dist.country,
    //                 establishmentMeans: dist.establishmentMeans,
    //                 status: dist.status,
    //             });
    //         }
    //     }
    // }

    /**
     * Store Xeno-canto audio data
     */
    // private async storeXenoCantoData(birdId: number, data: any): Promise<void> {
    //     if (data.recordings && data.recordings.length > 0) {
    //         for (const recording of data.recordings) {
    //             await this.mediaService.create({
    //                 birdId,
    //                 mediaType: 'audio',
    //                 url: recording.file,
    //                 thumbnailUrl: recording.sono?.small,
    //                 attribution: recording.rec,
    //                 license: recording.lic,
    //                 source: 'Xeno-canto',
    //                 metadata: {
    //                     quality: recording.q,
    //                     duration: recording.length,
    //                     recordingType: recording.type,
    //                     location: recording.loc,
    //                     country: recording.cnt,
    //                     date: recording.date,
    //                 },
    //             });
    //         }
    //     }
    // }


    
    /**
     * Extract distribution data from observations
     */
    private extractDistributionFromObservations(observations: any[]): any[] {
        const distributionMap = new Map();

        observations.forEach((obs) => {
            const key = `${obs.countryCode}-${obs.subnational1Code}`;
            if (!distributionMap.has(key)) {
                distributionMap.set(key, {
                    region: obs.subnational1Name,
                    country: obs.countryName,
                    countryCode: obs.countryCode,
                    seasonality: 'resident', // Default, could be enhanced
                });
            }
        });

        return Array.from(distributionMap.values());
    }
}
