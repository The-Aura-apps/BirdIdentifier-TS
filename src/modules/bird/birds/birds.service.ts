import {
    Injectable,
    NotFoundException,
    Logger,
    BadRequestException,
    ConflictException,
    UseGuards,
} from '@nestjs/common';
import Fuse from 'fuse.js';
import { BirdSuggestion } from './types/bird-suggestion.interface';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Bird } from './entities/bird.entity';
import { CreateBirdDto } from './dto/create-bird.dto';
import { UpdateBirdDto } from './dto/update-bird.dto';
import { BirdFood } from '../bird-foods/entities/bird-food.entity';
import { CreateBirdFoodDto } from '../bird-foods/dto/create-bird-food.dto';
import { UpdateBirdFoodDto } from '../bird-foods/dto/update-bird-food.dto';
import { Habitat } from '../habitats/entities/habitat.entity';
import { CommonName } from '../common-names/entities/common-name.entity';
import { TaxonomyService } from '../taxonomy/taxonomy.service';
import { BirdInfoWrapper } from 'src/modules/ai/wrappers/bird-info.wrapper';
import { BirdInfo } from 'src/modules/ai/types';
import { ConservationStatusService } from '../conservation-status/conservation-status.service';
import { ConservationStatus } from '../conservation-status/entities/conservation-status.entity';
import { Taxonomy } from '../taxonomy/entities/taxonomy.entity';
import { CreateCommonNameDto } from '../common-names/dto/create-common-name.dto';
import { Media } from 'src/modules/media/entities/media.entity';
import { BirdDistribution } from '../bird-distribution/entities/bird-distribution.entity';
import { Food } from '../foods/entities/food.entity';
import { CreateBirdDistributionDto } from '../bird-distribution/dto/create-bird-distribution.dto';
import { CreateMediaDto } from 'src/modules/media/dto/create-media.dto';

@Injectable()
export class BirdsService {
    private readonly logger = new Logger(BirdsService.name);
    private fuse!: Fuse<BirdSuggestion>;

    constructor(
        @InjectRepository(Bird)
        private readonly birdRepo: Repository<Bird>,
        @InjectRepository(BirdFood)
        private readonly birdFoodRepo: Repository<BirdFood>,
        @InjectRepository(Food)
        private readonly foodRepo: Repository<Food>,
        @InjectRepository(Habitat)
        private readonly habitatRepo: Repository<Habitat>,
        @InjectRepository(CommonName)
        private readonly commonNameRepo: Repository<CommonName>,
        @InjectRepository(Media)
        private readonly mediaRepo: Repository<Media>,
        @InjectRepository(BirdDistribution)
        private readonly distributionRepo: Repository<BirdDistribution>,
        private readonly taxonomyService: TaxonomyService,
        private readonly conservationStatusService: ConservationStatusService,
        private readonly birdInfoWrapper: BirdInfoWrapper,
    ) {
        this.loadCatalog();
    }

    /**
     * Load bird catalog from JSON file on service initialization
     */
    private loadCatalog() {
        try {
            const catalog: BirdSuggestion[] = require('../data/clements-catalog-2024.json');
            this.fuse = new Fuse(catalog, {
                keys: ['englishName', 'scientificName'],
                threshold: 0.35,
                includeScore: true,
                shouldSort: true,
                ignoreLocation: true,
            });
            this.logger.log(`Bird catalog loaded: ${catalog.length} species`);
        } catch (err) {
            this.logger.error('Failed to load bird catalog!', err);
            process.exit(1);
        }
    }

    /**
     * @param query - Search string (common name or scientific name)
     * @returns Array of up to 20 bird suggestions
     */
    searchCatalog(query: string): BirdSuggestion[] {
        if (!query?.trim()) {
            return [];
        }

        const results = this.fuse.search(query.trim());

        return results.slice(0, 20).map((r) => ({
            scientificName: r.item.scientificName,
            englishName: r.item.englishName,
        }));
    }

    /**
     * Create a new bird record
     */
    async create(createBirdDto: CreateBirdDto): Promise<Bird> {
        const {
            scientificName,
            taxonomy: taxDto,
            conservationStatus: consDto,
            commonNames: cmnDto,
            habitatIds,
            media: mediaDto,
            distributions: distributionsDto,
            birdFoods: birdFoodsDto,
            ...rest
        } = createBirdDto;

        if (!scientificName) {
            throw new BadRequestException('Scientific name is required');
        }

        // Check for duplicate scientific name
        const existing = await this.birdRepo.findOne({
            where: {
                scientificName,
            },
        });
        if (existing) {
            throw new ConflictException(
                `Bird with scientific name "${scientificName}" already exists`,
            );
        }

        // Handle  ManyToOne: Taxonomy     find-or-create using TaxonomyService
        let taxonomy; // any fucked up  &&  taxonomy: taxDto bug (should be entity, not DTO)
        if (taxDto) {
            taxonomy = await this.taxonomyService.findOrCreate(taxDto);
        }

        // Handle ManyToOne: Conservation Status    find-or-create
        let conservationStatus;
        if (consDto) {
            conservationStatus = await this.conservationStatusService.findOrCreate(consDto);
        }

        // Handel ManyToMany: Habitats
        let habitats: Habitat[] = [];
        if (habitatIds && habitatIds.length > 0) {
            habitats = await this.habitatRepo.find({
                where: { id: In(habitatIds) }, // ✅ Must use In() operator
            });

            // Validate all IDs found
            if (habitats.length !== habitatIds.length) {
                const foundIds = habitats.map((h) => h.id);
                const missingIds = habitatIds.filter((id) => !foundIds.includes(id));
                throw new NotFoundException(
                    `Habitats not found with IDs: ${missingIds.join(', ')}`,
                );
            }
        }

        // Handel OneToMany: Common Names
        let commonNames: CommonName[] = [];
        if (cmnDto && cmnDto.length > 0) {
            commonNames = cmnDto.map((cnDto) =>
                this.commonNameRepo.create({
                    name: cnDto.name,
                    language: cnDto.language || 'en',
                    region: cnDto.region || '',
                }),
            );
        }

        // Handel OneToMany: Media
        let media: Media[] = [];
        if (mediaDto && mediaDto.length > 0) {
            media = mediaDto.map((dto) =>
                this.mediaRepo.create({
                    storageKey: dto.storageKey,
                    type: dto.type,
                    size: dto.size,
                    caption: dto.caption,
                    source: dto.source,
                    attribution: dto.attribution,
                    orderIndex: dto.orderIndex || 0,
                    metadata: dto.metadata,
                }),
            );
        }

        // Handel OneToMany: Distributions
        let distributions: BirdDistribution[] = [];
        if (distributionsDto && distributionsDto.length > 0) {
            distributions = distributionsDto.map((dto) =>
                this.distributionRepo.create({
                    month: dto.month,
                    season: dto.season,
                    location: dto.location,
                    presenceScore: dto.presenceScore,
                    description: dto.description,
                    countries: dto.countries,
                }),
            );
        }

        //Handel ManyToMany with Junction: Bird-Food
        let birdFoods: BirdFood[] = [];
        if (birdFoodsDto && birdFoodsDto.length > 0) {
            const foodIds = birdFoodsDto.map((bf) => bf.foodId);
            const foods = await this.foodRepo.find({
                where: { id: In(foodIds) },
            });

            if (foods.length !== foodIds.length) {
                const foundIds = foods.map((f) => f.id);
                const missingIds = foodIds.filter((id) => !foundIds.includes(id));
                throw new NotFoundException(`Foods not found with IDs: ${missingIds.join(', ')}`);
            }

            // Step 4: Create junction table entities (BirdFood)
            birdFoods = birdFoodsDto.map((dto) => {
                const food = foods.find((f) => f.id === dto.foodId)!;
                return this.birdFoodRepo.create({
                    food: food,
                    isActive: dto.isActive ?? true,
                });
            });
        }

        // Create the bird entity
        const bird = this.birdRepo.create({
            scientificName,
            taxonomy,
            conservationStatus,
            commonNames,
            habitats,
            birdFoods,
            media,
            distributions,
            ...rest,
        });

        const saved = await this.birdRepo.save(bird);

        this.logger.log(`Bird created: ${saved.scientificName} (ID: ${saved.id})`);

        // Re-fetch the bird with all relations for return
        const fullBird = await this.birdRepo.findOne({
            where: { id: saved.id },
            relations: [
                'taxonomy',
                'conservationStatus',
                'commonNames',
                'habitats',
                'media',
                'distributions',
                'birdFoods',
                'birdFoods.food',
            ],
        });

        if (!fullBird) {
            throw new NotFoundException(`Saved bird with id ${saved.id} not found`);
        }

        return fullBird;
    }

    /**
     * Find bird by ID
     */
    async findOne(id: string): Promise<Bird> {
        if (!id) {
            throw new BadRequestException('Bird ID is required');
        }

        const bird = await this.birdRepo.findOne({
            where: {
                id: Number(id),
            },
            relations: [
                'observations',
                'media',
                'commonNames',
                'conservationStatus',
                'birdFoods',
                'birdFoods.food',
                'habitats',
                'taxonomy',
                'distributions',
            ],
        });
        if (!bird) {
            throw new NotFoundException(`Bird ${id} not found`);
        }
        return bird;
    }

    /**
     * Find bird by scientific name
     */
    async findByScientificName(scientificName: string): Promise<Bird> {
        if (!scientificName) {
            throw new BadRequestException('Scientific name is required');
        }

        const bird = await this.birdRepo.findOne({
            where: {
                scientificName,
            },
            relations: [
                'media',
                'commonNames',
                'conservationStatus',
                'birdFoods',
                'birdFoods.food',
                'habitats',
                'taxonomy',
            ],
        });

        if (!bird) {
            throw new NotFoundException(`Bird with scientific name "${scientificName}" not found`);
        }

        return bird;
    }

    /**
     * Get all Birds with pagination
     */
    async findAll(options: {
        page?: number;
        limit?: number;
        sortBy?: string;
        order?: 'ASC' | 'DESC';
    }): Promise<{
        data: Bird[];
        total: number;
    }> {
        const { page = 1, limit = 20, sortBy = 'createdAt', order = 'DESC' } = options;

        if (page < 1 || limit < 1) {
            throw new BadRequestException('Invalid pagination parameters');
        }

        const validSortFields = ['createdAt', 'scientificName', 'commonName'];
        if (!validSortFields.includes(sortBy)) {
            throw new BadRequestException(`Invalid sort field: ${sortBy}`);
        }

        const [data, total] = await this.birdRepo.findAndCount({
            skip: (page - 1) * limit,
            take: limit,
            order: {
                [sortBy]: order,
            },
            relations: ['media', 'commonNames', 'conservationStatus', 'taxonomy'],
        });

        return {
            data,
            total,
        };
    }

    /**
     * Update bird information
     */
    async update(id: string, updateBirdDto: UpdateBirdDto): Promise<Bird> {
        const bird = await this.findOne(id);

        // Check for scientific name conflict if updating it
        if (updateBirdDto?.scientificName && updateBirdDto.scientificName !== bird.scientificName) {
            const existing = await this.birdRepo.findOne({
                where: {
                    scientificName: updateBirdDto.scientificName.trim(),
                },
            });

            if (existing) {
                throw new ConflictException(
                    `Bird with scientific name "${updateBirdDto.scientificName}" already exists`,
                );
            }
        }

        // Prevent manual updates to certain fields
        const { ...safeUpdates } = updateBirdDto as any;
        delete safeUpdates.id;
        delete safeUpdates.createdAt;
        delete safeUpdates.updatedAt;

        Object.assign(bird, safeUpdates);
        const updated = await this.birdRepo.save(bird);

        this.logger.log(`Bird updated: ${id} - ${updated.scientificName}`);
        return updated;
    }

    /**
     * Delete bird record
     */
    async remove(id: string): Promise<void> {
        const bird = await this.findOne(id);

        // Check if bird has no observations
        if (bird.observations && bird.observations.length > 0) {
            throw new BadRequestException(
                `Cannot delete bird ${id}: ${bird.observations.length} observations are linked to it`,
            );
        }

        await this.birdRepo.remove(bird);
        this.logger.log(`Bird deleted: ${id} - ${bird.scientificName}`);
    }

    /**
     * Find or create bird by scientific name (used by AI processing)
     */
    async findOrCreate(scientificName: string): Promise<Bird> {
        if (!scientificName || scientificName.trim().length === 0) {
            throw new BadRequestException('Scientific name is required');
        }

        const normalizedName = scientificName.trim();

        // Try to find existing bird
        let bird = await this.birdRepo.findOne({
            where: { scientificName: normalizedName },
            relations: [
                'media',
                'commonNames',
                'conservationStatus',
                'habitats',
                'taxonomy',
                'distributions',
                'birdFoods',
                'birdFoods.food',
            ],
        });

        if (bird) {
            this.logger.log(`Bird already exists: ${bird.scientificName} (ID: ${bird.id})`);
            return bird;
        }

        // Create minimal bird if not found
        this.logger.log(`Creating new bird record with AI enrichment: ${normalizedName}`);

        // Create bird first
        bird = this.birdRepo.create({
            scientificName: normalizedName,
        });
        const savedBird = await this.birdRepo.save(bird);
        this.logger.log(`Bird created with ID: ${savedBird.id}`);

        // Fetch comprehensive info from AI
        let birdInfo: BirdInfo | null = null;
        try {
            birdInfo = await this.birdInfoWrapper.fetchInfo(normalizedName);
            this.logger.log(`AI info fetched successfully for ${normalizedName}`);
        } catch (err) {
            this.logger.error(`Failed to fetch bird info for ${normalizedName}: ${err.message}`);
            return savedBird; // Return minimal bird if AI fetch fails
        }

        // Enrich bird data with all relations
        if (birdInfo && savedBird.id) {
            try {
                await this.enrichBirdData(savedBird.id, birdInfo);

                // Reload the bird to get all enriched data
                const enrichedBird = await this.birdRepo.findOne({
                    where: { id: savedBird.id },
                    relations: [
                        'commonNames',
                        'media',
                        'conservationStatus',
                        'habitats',
                        'taxonomy',
                        'distributions',
                        'birdFoods',
                        'birdFoods.food',
                    ],
                });

                if (enrichedBird) {
                    this.logger.log(`Bird fully enriched: ${enrichedBird.scientificName}`);
                    return enrichedBird;
                }
            } catch (err) {
                this.logger.error(
                    `Failed to enrich bird data for ${normalizedName}: ${err.message}`,
                );
            }
        }

        return savedBird;
    }

    /**
     * Search birds by common name or scientific name
     */
    async search(
        query: string,
        options: {
            page?: number;
            limit?: number;
        } = {},
    ): Promise<{
        data: Bird[];
        total: number;
    }> {
        const { page = 1, limit = 10 } = options;

        const [data, total] = await this.birdRepo
            .createQueryBuilder('bird')
            .leftJoinAndSelect('bird.commonNames', 'commonName')
            .leftJoinAndSelect('bird.media', 'media')
            .leftJoinAndSelect('bird.conservationStatus', 'conservationStatus')
            .leftJoinAndSelect('bird.taxonomy', 'taxonomy')
            .where('bird.scientificName ILIKE :query', {
                query: `%${query}%`,
            })
            .orWhere('commonName.name ILIKE :query', {
                query: `%${query}%`,
            })
            .skip((page - 1) * limit)
            .take(limit)
            .orderBy('bird.scientificName', 'ASC')
            .getManyAndCount();

        return {
            data,
            total,
        };
    }

    /**
     * Enrich bird data with additional information
     */
    private async enrichBirdData(birdId: number, birdInfo: BirdInfo): Promise<void> {
        const bird = await this.birdRepo.findOne({
            where: { id: birdId },
            relations: [
                'taxonomy',
                'conservationStatus',
                'habitats',
                'commonNames',
                'distributions',
                'birdFoods',
            ],
        });

        if (!bird) {
            throw new NotFoundException(`Bird with ID ${birdId} not found`);
        }

        // Update basic text fields
        const updateData: Partial<Bird> = {};

        if (birdInfo.description) updateData.description = birdInfo.description;
        if (birdInfo.behavior) updateData.behavior = birdInfo.behavior;
        if (birdInfo.feedingHabits) updateData.feedingHabits = birdInfo.feedingHabits;
        if (birdInfo.nestingHabits) updateData.nestingHabits = birdInfo.nestingHabits;
        if (birdInfo.eggsDescription) updateData.eggsDescription = birdInfo.eggsDescription;
        if (birdInfo.size) updateData.size = birdInfo.size;
        if (birdInfo.lifeExpectancyYears)
            updateData.lifeExpectancyYears = birdInfo.lifeExpectancyYears;
        if (
            birdInfo.coolFacts &&
            Array.isArray(birdInfo.coolFacts) &&
            birdInfo.coolFacts.length > 0
        ) {
            updateData.coolFacts = birdInfo.coolFacts.join('\n\n');
        }

        //  Handle Taxonomy (ManyToOne)
        if (birdInfo.taxonomy) {
            try {
                const taxonomy = await this.taxonomyService.findOrCreate(birdInfo.taxonomy);
                updateData.taxonomy = taxonomy;
                this.logger.log(
                    `Taxonomy set for bird ${birdId}: ${taxonomy.order} - ${taxonomy.family}`,
                );
            } catch (err) {
                this.logger.error(`Failed to set taxonomy for bird ${birdId}: ${err.message}`);
            }
        }

        // Handle Conservation Status (ManyToOne)
        if (birdInfo.conservationStatus) {
            try {
                const conservationStatus = await this.conservationStatusService.findOrCreate(
                    birdInfo.conservationStatus,
                );
                updateData.conservationStatus = conservationStatus;
                this.logger.log(
                    `Conservation status set for bird ${birdId}: ${conservationStatus.code}`,
                );
            } catch (err) {
                this.logger.error(
                    `Failed to set conservation status for bird ${birdId}: ${err.message}`,
                );
            }
        }

        // saving birds table filds
        if (Object.keys(updateData).length > 0) {
            Object.assign(bird, updateData);
            await this.birdRepo.save(bird);
            this.logger.log(
                `Bird data enriched with ${Object.keys(updateData).length} fields: ${birdId}`,
            );
        }

        //  Handle Common Names (OneToMany)
        if (
            birdInfo.commonNames &&
            Array.isArray(birdInfo.commonNames) &&
            birdInfo.commonNames.length > 0
        ) {
            try {
                // Remove existing common names to avoid duplicates
                if (bird.commonNames && bird.commonNames.length > 0) {
                    await this.commonNameRepo.remove(bird.commonNames);
                }

                // Create new common names
                const commonNameEntities = birdInfo.commonNames.map((cn) =>
                    this.commonNameRepo.create({
                        name: cn.name,
                        language: cn.language || 'en',
                        region: cn.region || 'General',
                        bird: bird,
                    }),
                );

                await this.commonNameRepo.save(commonNameEntities);
                this.logger.log(
                    `Common names added for bird ${birdId}: ${commonNameEntities.length} names`,
                );
            } catch (err) {
                this.logger.error(`Failed to add common names for bird ${birdId}: ${err.message}`);
            }
        }

        //  Handle Distributions (OneToMany)
        if (
            birdInfo.distributions &&
            Array.isArray(birdInfo.distributions) &&
            birdInfo.distributions.length > 0
        ) {
            try {
                // Remove existing distributions to avoid duplicates
                if (bird.distributions && bird.distributions.length > 0) {
                    await this.distributionRepo.remove(bird.distributions);
                }

                // Create new distributions
                const distributionEntities = birdInfo.distributions.map((dist) =>
                    this.distributionRepo.create({
                        month: dist.month,
                        season: dist.season,
                        location: dist.location,
                        presenceScore: dist.presenceScore || 0.5,
                        description: dist.description,
                        countries: dist.countries || [],
                        bird: bird,
                    }),
                );

                await this.distributionRepo.save(distributionEntities);
                this.logger.log(
                    `Distributions added for bird ${birdId}: ${distributionEntities.length} entries`,
                );
            } catch (err) {
                this.logger.error(`Failed to add distributions for bird ${birdId}: ${err.message}`);
            }
        }

        // Handle Bird Foods (ManyToMany with junction table)
        if (
            birdInfo.birdFoods &&
            Array.isArray(birdInfo.birdFoods) &&
            birdInfo.birdFoods.length > 0
        ) {
            try {
                // Find or create food entries
                const foodEntities: any[] = [];

                for (const foodInfo of birdInfo.birdFoods) {
                    // Use type assertion to tell TypeScript this is BirdFoodInfo, not BirdFood entity
                    const foodData = foodInfo as any; // Temporary workaround

                    let food = await this.foodRepo.findOne({
                        where: { name: foodData.name },
                    });

                    // Create food if it doesn't exist
                    if (!food) {
                        food = this.foodRepo.create({
                            name: foodData.name,
                            description: foodData.description,
                        });
                        food = await this.foodRepo.save(food);
                        this.logger.log(`Created new food: ${food.name}`);
                    }

                    foodEntities.push({ food });
                }

                // Remove existing bird-food relationships
                if (bird.birdFoods && bird.birdFoods.length > 0) {
                    await this.birdFoodRepo.remove(bird.birdFoods);
                }

                // Create new bird-food relationships
                const birdFoodEntities = foodEntities.map(({ food }) =>
                    this.birdFoodRepo.create({
                        bird: bird,
                        food: food,
                        isActive: true,
                    }),
                );

                await this.birdFoodRepo.save(birdFoodEntities);
                this.logger.log(
                    `Bird foods added for bird ${birdId}: ${birdFoodEntities.length} items`,
                );
            } catch (err) {
                this.logger.error(`Failed to add bird foods for bird ${birdId}: ${err.message}`);
            }
        }

        
        // Handle Habitats (ManyToMany) - Place this AFTER all other saves
        if (birdInfo.habitats && Array.isArray(birdInfo.habitats) && birdInfo.habitats.length > 0) {
            try {
                // ✅ Reload the bird to ensure clean state
                const birdWithHabitats = await this.birdRepo.findOne({
                    where: { id: birdId },
                    relations: ['habitats'],
                });

                if (!birdWithHabitats) {
                    throw new NotFoundException(`Bird ${birdId} not found for habitat assignment`);
                }

                const habitatEntities = await this.habitatRepo.find({
                    where: {
                        name: In(birdInfo.habitats),
                    },
                });

                if (habitatEntities.length > 0) {
                    // Assign found habitats
                    birdWithHabitats.habitats = habitatEntities;

                    // Save the bird
                    await this.birdRepo.save(birdWithHabitats);

                    this.logger.log(
                        `Habitats set for bird ${birdId}: ${habitatEntities.map((h) => h.name).join(', ')}`,
                    );
                } else {
                    this.logger.warn(
                        `No matching habitats found for bird ${birdId}. AI returned: [${birdInfo.habitats.join(', ')}]`,
                    );
                }
            } catch (err) {
                this.logger.error(
                    `Failed to set habitats for bird ${birdId}: ${err.message}`,
                    err.stack,
                );
            }
        }

        // Save the bird with updated relations
        //await this.birdRepo.save(bird);
        this.logger.log(`Bird ${birdId} enrichment completed successfully`);
    }

    /**
     * Get observation count for a bird
     */
    async getObservationCount(id: string): Promise<number> {
        const bird = await this.birdRepo.findOne({
            where: {
                id: Number(id),
            },
            relations: ['observations'],
        });

        if (!bird) {
            throw new NotFoundException(`Bird ${id} not found`);
        }

        return bird.observations?.length ?? 0;
    }

    /**
     * Food relationship methods
     */
    async getFoods(birdId: number) {
        const bird = await this.birdRepo.findOne({
            where: {
                id: birdId,
            },
            relations: ['birdFoods', 'birdFoods.food'],
        });

        if (!bird) {
            throw new NotFoundException(`Bird with ID ${birdId} not found`);
        }

        return {
            bird: {
                id: bird.id,
                scientificName: bird.scientificName,
            },
            foods: bird.birdFoods.map((bf) => ({
                relationshipId: bf.id,
                isActive: bf.isActive,
                food: {
                    id: bf.food.id,
                    name: bf.food.name,
                    description: bf.food.description,
                    imageUrl: bf.food.getImageUrl?.(),
                },
            })),
        };
    }

    async addFood(birdId: number, createBirdFoodDto: CreateBirdFoodDto) {
        const bird = await this.birdRepo.findOne({
            where: { id: birdId },
            relations: ['birdFoods', 'birdFoods.food'],
        });

        if (!bird) {
            throw new BadRequestException('Invalid bird ID');
        }

        const food = await this.foodRepo.findOne({
            where: { id: createBirdFoodDto.foodId },
        });

        if (!food) {
            throw new NotFoundException(`Food with ID ${createBirdFoodDto.foodId} not found`);
        }

        const existing = bird.birdFoods.find((bf) => bf.food.id === createBirdFoodDto.foodId);

        if (existing) {
            if (!existing.isActive && createBirdFoodDto.isActive) {
                // Reactivate
                existing.isActive = true;
                const updated = await this.birdFoodRepo.save(existing);
                this.logger.log(
                    `Reactivated bird-food relationship: ${birdId}-${createBirdFoodDto.foodId}`,
                );
                return updated;
            }
            throw new ConflictException('Bird-food relationship already exists');
        }

        // Create new rel
        const birdFood = this.birdFoodRepo.create({
            bird,
            food,
            isActive: createBirdFoodDto.isActive ?? true,
        });

        const saved = await this.birdFoodRepo.save(birdFood);
        this.logger.log(`Bird-food relationship created: ${birdId}-${createBirdFoodDto.foodId}`);

        return saved;
    }

    async updateFood(birdId: number, foodId: number, updateBirdFoodDto: UpdateBirdFoodDto) {
        const birdFood = await this.birdFoodRepo.findOne({
            where: {
                bird: { id: birdId },
                food: { id: foodId },
            },
        });

        if (!birdFood) {
            throw new NotFoundException(`Bird-food relationship not found`);
        }

        Object.assign(birdFood, updateBirdFoodDto);
        const updated = await this.birdFoodRepo.save(birdFood);

        this.logger.log(`Bird-food relationship updated: ${birdId}-${foodId}`);
        return updated;
    }

    async removeFood(birdId: number, foodId: number) {
        const birdFood = await this.birdFoodRepo.findOne({
            where: {
                bird: { id: birdId },
                food: { id: foodId },
            },
        });

        if (!birdFood) {
            throw new NotFoundException(`Bird-food relationship not found`);
        }

        await this.birdFoodRepo.remove(birdFood);
        this.logger.log(`Bird-food relationship deleted: ${birdId}-${foodId}`);
    }

    async toggleFoodActive(birdId: number, foodId: number) {
        const birdFood = await this.birdFoodRepo.findOne({
            where: {
                bird: { id: birdId },
                food: { id: foodId },
            },
            relations: ['food'],
        });

        if (!birdFood) {
            throw new NotFoundException(`Bird-food relationship not found`);
        }

        birdFood.isActive = !birdFood.isActive;
        const updated = await this.birdFoodRepo.save(birdFood);

        this.logger.log(
            `Bird-food relationship ${birdId}-${foodId} active status: ${updated.isActive}`,
        );
        return {
            id: updated.id,
            isActive: updated.isActive,
            food: {
                id: updated.food.id,
                name: updated.food.name,
            },
        };
    }

    /**
     * Habitat relationship methods
     */
    async getHabitats(birdId: number) {
        const bird = await this.birdRepo.findOne({
            where: {
                id: birdId,
            },
            relations: ['habitats'],
        });

        if (!bird) {
            throw new NotFoundException(`Bird with ID ${birdId} not found`);
        }

        return {
            bird: {
                id: bird.id,
                scientificName: bird.scientificName,
            },
            habitats: bird.habitats,
        };
    }

    async addHabitat(birdId: number, habitatId: number) {
        const bird = await this.birdRepo.findOne({
            where: { id: birdId },
            relations: ['habitats'],
        });

        if (!bird) {
            throw new NotFoundException(`Bird with ID ${birdId} not found`);
        }

        const habitat = await this.habitatRepo.findOne({
            where: { id: habitatId },
        });

        if (!habitat) {
            throw new NotFoundException(`Habitat with ID ${habitatId} not found`);
        }

        // Check if already associated
        const isAlreadyAssociated = bird.habitats.some((h) => h.id === habitatId);
        if (isAlreadyAssociated) {
            throw new ConflictException(
                `Habitat "${habitat.name}" is already associated with this bird`,
            );
        }

        // Add habitat
        bird.habitats.push(habitat);
        await this.birdRepo.save(bird);

        this.logger.log(`Habitat ${habitatId} added to bird ${birdId}`);

        return {
            message: 'Habitat added successfully',
            bird: {
                id: bird.id,
                scientificName: bird.scientificName,
            },
            habitat: {
                id: habitat.id,
                name: habitat.name,
            },
        };
    }

    async removeHabitat(birdId: number, habitatId: number) {
        const bird = await this.birdRepo.findOne({
            where: { id: birdId },
            relations: ['habitats'],
        });

        if (!bird) {
            throw new NotFoundException(`Bird with ID ${birdId} not found`);
        }

        const habitatIndex = bird.habitats.findIndex((h) => h.id === habitatId);
        if (habitatIndex === -1) {
            throw new NotFoundException(
                `Habitat with ID ${habitatId} is not associated with this bird`,
            );
        }

        // Remove habitat
        bird.habitats.splice(habitatIndex, 1);
        await this.birdRepo.save(bird);

        this.logger.log(`Habitat ${habitatId} removed from bird ${birdId}`);
    }

    async findByHabitat(
        habitatId: number,
        options: {
            page?: number;
            limit?: number;
        } = {},
    ): Promise<{
        data: Bird[];
        total: number;
    }> {
        const { page = 1, limit = 20 } = options;

        const queryBuilder = await this.birdRepo
            .createQueryBuilder('bird')
            .innerJoin('bird.habitats', 'habitat')
            .leftJoinAndSelect('bird.media', 'media')
            .leftJoinAndSelect('bird.commonNames', 'commonNames')
            .leftJoinAndSelect('bird.taxonomy', 'taxonomy')
            .where('habitat.id = :habitatId', {
                habitatId,
            })
            .skip((page - 1) * limit)
            .take(limit)
            .orderBy('bird.scientificName', 'ASC');

        const [data, total] = await queryBuilder.getManyAndCount();

        return { data, total };
    }

    /**
     * Common names methods
     */
    async getCommonNames(birdId: number) {
        // const commonNames = await this.commonNameRepo.find({
        //     where: { birdId },
        //     order: { name: 'ASC' },
        // });

        const bird = await this.birdRepo.findOne({
            where: {
                id: birdId,
            },
            select: ['commonNames'],
        });

        if (!bird) {
            throw new NotFoundException(`Bird with ID ${birdId} not found`);
        }

        return {
            bird: {
                id: bird.id,
                scientificName: bird.scientificName,
            },
            commonNames: bird.commonNames || [],
        };
    }

    async addCommonName(birdId: number, createCommonNameDto: CreateCommonNameDto) {
        const bird = await this.birdRepo.findOne({
            where: {
                id: birdId,
            },
        });

        if (!bird) {
            throw new NotFoundException(`Bird with ID ${birdId} not found`);
        }

        // Check for duplicate
        const existing = await this.commonNameRepo.findOne({
            where: {
                name: createCommonNameDto.name,
                language: createCommonNameDto.language || 'en',
            },
        });

        if (existing) {
            throw new ConflictException(
                `Common name "${createCommonNameDto.name}" already exists for this bird`,
            );
        }

        const commonName = this.commonNameRepo.create({
            name: createCommonNameDto.name,
            language: createCommonNameDto.language || 'en',
            region: createCommonNameDto.region || '',
            bird: bird, // Link bird entity
        });

        const saved = await this.commonNameRepo.save(commonName);
        this.logger.log(`Common name added for bird ${birdId}: ${saved.name}`);
        return saved;
    }

    /**
     * Media methods
     */
    async getMedia(birdId: number) {
        const bird = await this.birdRepo.findOne({
            where: { id: birdId },
            relations: ['media'],
        });

        if (!bird) {
            throw new NotFoundException(`Bird with ID ${birdId} not found`);
        }

        return {
            bird: {
                id: bird.id,
                scientificName: bird.scientificName,
            },
            media: bird.media || [],
        };
    }

    async addMedia(birdId: number, createDto: CreateMediaDto) {
        const bird = await this.birdRepo.findOne({
            where: { id: birdId },
        });

        if (!bird) {
            throw new NotFoundException(`Bird with ID ${birdId} not found`);
        }

        const media = this.mediaRepo.create({
            bird,
            storageKey: createDto.storageKey,
            type: createDto.type,
            size: createDto.size,
            caption: createDto.caption,
            source: createDto.source,
            attribution: createDto.attribution,
            orderIndex: createDto.orderIndex || 0,
            metadata: createDto.metadata,
        });

        const saved = await this.mediaRepo.save(media);
        this.logger.log(`Media added to bird ${birdId}`);
        return saved;
    }

    /**
     * Taxonomy methods
     */
    async getTaxonomy(birdId: number): Promise<{
        bird: {
            id: number;
            scientificName: string;
            commonNames: CommonName[];
        };
        taxonomy: Taxonomy | null;
    }> {
        const bird = await this.birdRepo.findOne({
            where: {
                id: birdId,
            },
            relations: ['taxonomy'],
            select: ['id', 'scientificName', 'commonNames'],
        });

        if (!bird) {
            throw new NotFoundException(`Bird with ID ${birdId} not found`);
        }

        return {
            bird: {
                id: bird.id,
                scientificName: bird.scientificName,
                commonNames: bird.commonNames || [],
            },
            taxonomy: bird.taxonomy,
        };
    }

    /**
     * Get conservation status for a bird
     */
    async getConservationStatus(birdId: number): Promise<{
        bird: {
            id: number;
            scientificName: string;
            commonNames: CommonName[]; // Full objects
        };
        conservationStatus: ConservationStatus | null;
    }> {
        const bird = await this.birdRepo.findOne({
            where: {
                id: birdId,
            },
            relations: ['conservationStatus', 'commonNames'],
            select: ['id', 'scientificName'],
        });

        if (!bird) {
            throw new NotFoundException(`Bird with ID ${birdId} not found`);
        }

        return {
            bird: {
                id: bird.id,
                scientificName: bird.scientificName,
                commonNames: bird.commonNames || [],
            },
            conservationStatus: bird.conservationStatus,
        };
    }

    /**
     * Distribution methods
     */
    async getDistributions(birdId: number) {
        const bird = await this.birdRepo.findOne({
            where: { id: birdId },
            relations: ['distributions'],
        });

        if (!bird) {
            throw new NotFoundException(`Bird with ID ${birdId} not found`);
        }

        return {
            bird: {
                id: bird.id,
                scientificName: bird.scientificName,
            },
            distributions: bird.distributions || [],
        };
    }

    async addDistribution(birdId: number, createDto: CreateBirdDistributionDto) {
        const bird = await this.birdRepo.findOne({
            where: { id: birdId },
            relations: ['distributions'],
        });

        if (!bird) {
            throw new NotFoundException(`Bird with ID ${birdId} not found`);
        }

        // Check for duplicate
        const existing = bird.distributions.find(
            (d) => d.season === createDto.season && d.month === createDto.month,
        );

        if (existing) {
            throw new ConflictException(
                `Distribution for ${createDto.season} month ${createDto.month} already exists`,
            );
        }

        const distribution = this.distributionRepo.create({
            bird,
            month: createDto.month,
            season: createDto.season,
            location: createDto.location,
            presenceScore: createDto.presenceScore,
            description: createDto.description,
            countries: createDto.countries,
        });

        const saved = await this.distributionRepo.save(distribution);
        this.logger.log(`Distribution added to bird ${birdId}`);
        return saved;
    }
}
