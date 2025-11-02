import {
    Injectable,
    NotFoundException,
    Logger,
    BadRequestException,
    ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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

@Injectable()
export class BirdsService {
    private readonly logger = new Logger(BirdsService.name);

    constructor(
        @InjectRepository(Bird)
        private readonly birdRepo: Repository<Bird>,
        @InjectRepository(BirdFood)
        private readonly birdFoodRepo: Repository<BirdFood>,
        @InjectRepository(Habitat)
        private readonly habitatRepo: Repository<Habitat>,
        @InjectRepository(CommonName)
        private readonly commonNameRepo: Repository<CommonName>,
        private readonly taxonomyService: TaxonomyService,
        private readonly birdInfoWrapper: BirdInfoWrapper,
    ) {}

    /**
     * Create a new bird record
     */
    async create(createBirdDto: CreateBirdDto): Promise<Bird> {
        const { scientificName, taxonomy: taxDto, ...rest } = createBirdDto;

        if (!scientificName) {
            throw new BadRequestException('Scientific name is required');
        }

        // Check for duplicate scientific name
        const existing = await this.birdRepo.findOne({
            where: { scientificName },
        });
        if (existing) {
            throw new ConflictException(
                `Bird with scientific name "${scientificName}" already exists`,
            );
        }

        // Handle taxonomy find-or-create using TaxonomyService
        let taxonomy; // any fucked up
        if (taxDto) {
            taxonomy = await this.taxonomyService.findOrCreate(taxDto);
        }

        // Create the bird entity - taxonomy is a SINGLE object, not an array!
        const bird = this.birdRepo.create({
            scientificName,
            taxonomy, // Assign directly (ManyToOne relationship)
            ...rest,
        });

        // Save bird
        const saved = await this.birdRepo.save(bird);

        // Re-fetch the bird with all relations for return
        const fullBird = await this.birdRepo.findOne({
            where: { id: saved.id },
            relations: [
                'taxonomy',
                'commonNames',
                'media',
                'conservationStatus',
                'habitats',
                'distributions',
                'birdFoods',
                'birdFoods.food',
            ],
        });

        if (!fullBird) {
            throw new NotFoundException(
                `Saved bird with id ${saved.id} not found`,
            );
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
            where: { id: Number(id) },
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
            where: { scientificName },
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
            throw new NotFoundException(
                `Bird with scientific name "${scientificName}" not found`,
            );
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
    }): Promise<{ data: Bird[]; total: number }> {
        const {
            page = 1,
            limit = 20,
            sortBy = 'createdAt',
            order = 'DESC',
        } = options;

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
            order: { [sortBy]: order },
            relations: [
                'media',
                'commonNames',
                'conservationStatus',
                'taxonomy',
            ],
        });

        return { data, total };
    }

    /**
     * Update bird information
     */
    async update(id: string, updateBirdDto: UpdateBirdDto): Promise<Bird> {
        const bird = await this.findOne(id);

        // Check for scientific name conflict if updating it
        if (
            updateBirdDto?.scientificName &&
            updateBirdDto.scientificName !== bird.scientificName
        ) {
            const existing = await this.birdRepo.findOne({
                where: { scientificName: updateBirdDto.scientificName.trim() },
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
            ],
        });

        if (bird) {
            return bird;
        }

        // Create minimal bird if not found
        this.logger.log(`Creating new bird record: ${normalizedName}`);

        let birdInfo: BirdInfo | null = null;
        try {
            birdInfo = await this.birdInfoWrapper.fetchInfo(normalizedName);
        } catch (err) {
            this.logger.warn(
                `Failed to fetch bird info for ${normalizedName}: ${err.message}`,
            );
        }

        bird = this.birdRepo.create({
            scientificName: normalizedName,
            description: birdInfo?.description,
            behavior: birdInfo?.behavior,
        });

        const savedBird = await this.birdRepo.save(bird);
        this.logger.log(
            `Bird created: ${savedBird.id} - ${savedBird.scientificName}`,
        );

        // Enrich bird data if possible
        if (birdInfo && savedBird.id) {
            try {
                await this.enrichBirdData(savedBird.id, birdInfo);
                // Reload the bird to get enriched data
                return (
                    (await this.birdRepo.findOne({
                        where: { id: savedBird.id },
                        relations: [
                            'commonNames',
                            'media',
                            'conservationStatus',
                            'habitats',
                            'taxonomy',
                        ],
                    })) || savedBird
                );
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
        options: { page?: number; limit?: number } = {},
    ): Promise<{ data: Bird[]; total: number }> {
        const { page = 1, limit = 20 } = options;

        const [data, total] = await this.birdRepo
            .createQueryBuilder('bird')
            .leftJoinAndSelect('bird.commonNames', 'commonName')
            .leftJoinAndSelect('bird.media', 'media')
            .leftJoinAndSelect('bird.conservationStatus', 'conservationStatus')
            .leftJoinAndSelect('bird.taxonomy', 'taxonomy')
            .where('bird.scientificName ILIKE :query', { query: `%${query}%` })
            .orWhere('commonName.name ILIKE :query', { query: `%${query}%` })
            .skip((page - 1) * limit)
            .take(limit)
            .orderBy('bird.scientificName', 'ASC')
            .getManyAndCount();

        return { data, total };
    }

    /**
     * Get birds by habitat
     */
    async findByHabitat(
        habitatId: number,
        options: { page?: number; limit?: number } = {},
    ): Promise<{ data: Bird[]; total: number }> {
        const { page = 1, limit = 20 } = options;

        const [data, total] = await this.birdRepo
            .createQueryBuilder('bird')
            .innerJoin('bird.habitats', 'habitat')
            .leftJoinAndSelect('bird.media', 'media')
            .leftJoinAndSelect('bird.commonNames', 'commonNames')
            .leftJoinAndSelect('bird.taxonomy', 'taxonomy')
            .where('habitat.id = :habitatId', { habitatId })
            .skip((page - 1) * limit)
            .take(limit)
            .orderBy('bird.scientificName', 'ASC')
            .getManyAndCount();

        return { data, total };
    }

    /**
     * Get birds by conservation status
     */
    // async findByConservationStatus(
    //     statusId: number,
    //     options: { page?: number; limit?: number } = {},
    // ): Promise<{ data: Bird[]; total: number }> {
    //     const { page = 1, limit = 20 } = options;

    //     const [data, total] = await this.birdRepo.findAndCount({
    //         where: { conservationStatus: statusId },
    //         relations: ['media', 'commonNames', 'conservationStatus'],
    //         skip: (page - 1) * limit,
    //         take: limit,
    //         order: { scientificName: 'ASC' },
    //     });

    //     return { data, total };
    // }

    /**
     * Enrich bird data with additional information
     */
    private async enrichBirdData(
        birdId: number,
        birdInfo: BirdInfo,
    ): Promise<void> {
        const updateData: Partial<Bird> = {};

        if (birdInfo.description) {
            updateData.description = birdInfo.description;
        }

        if (birdInfo.behavior) {
            updateData.behavior = birdInfo.behavior;
        }

        if (birdInfo.feedingHabits) {
            updateData.feedingHabits = birdInfo.feedingHabits;
        }

        if (birdInfo.nestingHabits) {
            updateData.nestingHabits = birdInfo.nestingHabits;
        }

        if (birdInfo.eggsDescription) {
            updateData.eggsDescription = birdInfo.eggsDescription;
        }

        if (birdInfo.coolFacts && birdInfo.coolFacts.length > 0) {
            updateData.coolFacts = birdInfo.coolFacts.join('\n');
        }

        if (birdInfo.size) {
            updateData.size = birdInfo.size;
        }

        if (birdInfo.lifeExpectancyYears) {
            updateData.lifeExpectancyYears = birdInfo.lifeExpectancyYears;
        }

        if (Object.keys(updateData).length > 0) {
            await this.birdRepo.update(birdId, updateData);
            this.logger.log(`Bird data enriched: ${birdId}`);
        }

        if (birdInfo.commonNames && birdInfo.commonNames.length > 0) {
            await this.handleCommonNames(birdId, birdInfo.commonNames);
        }
    }

    /**
     * Handle common names separately
     */
    private async handleCommonNames(
        birdId: number,
        commonNames: CommonName[],
    ): Promise<void> {
        // Remove existing common names
        await this.commonNameRepo.delete({ birdId });

        // Create new common names
        for (const commonName of commonNames) {
            const newCommonName = this.commonNameRepo.create({
                ...commonName,
                birdId,
            });
            await this.commonNameRepo.save(newCommonName);
        }
    }

    /**
     * Get observation count for a bird
     */
    async getObservationCount(id: string): Promise<number> {
        const bird = await this.birdRepo.findOne({
            where: { id: Number(id) },
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
            where: { id: birdId },
            relations: ['birdFoods', 'birdFoods.food', 'commonNames'],
        });

        if (!bird) {
            throw new NotFoundException(`Bird with ID ${birdId} not found`);
        }

        const activeFoods = bird.birdFoods.filter((bf) => bf.isActive);

        return {
            bird: {
                id: bird.id,
                scientificName: bird.scientificName,
            },
            foods: activeFoods.map((bf) => ({
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
        const bird = await this.findOne(birdId.toString());

        if (!bird.id) {
            throw new BadRequestException('Invalid bird ID');
        }

        // Check if relationship already exists
        const existing = await this.birdFoodRepo.findOne({
            where: {
                birdId: bird.id,
                foodId: createBirdFoodDto.foodId,
            },
        });

        if (existing) {
            if (!existing.isActive) {
                existing.isActive = true;
                const activated = await this.birdFoodRepo.save(existing);
                this.logger.log(
                    `Reactivated bird-food relationship: ${birdId}-${createBirdFoodDto.foodId}`,
                );
                return activated;
            }
            throw new ConflictException(
                'Bird-food relationship already exists',
            );
        }

        const birdFood = this.birdFoodRepo.create({
            birdId: bird.id,
            foodId: createBirdFoodDto.foodId,
            isActive: true,
        });

        const saved = await this.birdFoodRepo.save(birdFood);
        this.logger.log(
            `Bird-food relationship created: ${birdId}-${createBirdFoodDto.foodId}`,
        );
        return saved;
    }

    async updateFood(
        birdId: number,
        foodId: number,
        updateBirdFoodDto: UpdateBirdFoodDto,
    ) {
        const birdFood = await this.birdFoodRepo.findOne({
            where: { birdId, foodId },
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
            where: { birdId, foodId },
        });

        if (!birdFood) {
            throw new NotFoundException(`Bird-food relationship not found`);
        }

        await this.birdFoodRepo.remove(birdFood);
        this.logger.log(`Bird-food relationship deleted: ${birdId}-${foodId}`);
    }

    async toggleFoodActive(birdId: number, foodId: number) {
        const birdFood = await this.birdFoodRepo.findOne({
            where: { birdId, foodId },
        });

        if (!birdFood) {
            throw new NotFoundException(`Bird-food relationship not found`);
        }

        birdFood.isActive = !birdFood.isActive;
        const updated = await this.birdFoodRepo.save(birdFood);

        this.logger.log(
            `Bird-food relationship ${birdId}-${foodId} active status: ${updated.isActive}`,
        );
        return updated;
    }

    /**
     * Habitat relationship methods
     */
    async getHabitats(birdId: number) {
        const bird = await this.birdRepo.findOne({
            where: { id: birdId },
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
        const bird = await this.findOne(birdId.toString());

        const habitat = await this.habitatRepo.findOne({
            where: { id: habitatId },
        });

        if (!habitat) {
            throw new NotFoundException(
                `Habitat with ID ${habitatId} not found`,
            );
        }

        // Check if relationship already exists
        if (bird.habitats?.some((h) => h.id === habitatId)) {
            throw new ConflictException(
                'Bird-habitat relationship already exists',
            );
        }

        if (!bird.habitats) {
            bird.habitats = [];
        }

        bird.habitats.push(habitat);
        const updated = await this.birdRepo.save(bird);

        this.logger.log(
            `Bird-habitat relationship created: ${birdId}-${habitatId}`,
        );
        return updated;
    }

    async removeHabitat(birdId: number, habitatId: number) {
        const bird = await this.birdRepo.findOne({
            where: { id: birdId },
            relations: ['habitats'],
        });

        if (!bird) {
            throw new NotFoundException(`Bird with ID ${birdId} not found`);
        }

        bird.habitats = bird.habitats.filter((h) => h.id !== habitatId);
        const updated = await this.birdRepo.save(bird);

        this.logger.log(
            `Bird-habitat relationship deleted: ${birdId}-${habitatId}`,
        );
        return updated;
    }

    /**
     * Common names methods
     */
    async getCommonNames(birdId: number) {
        const commonNames = await this.commonNameRepo.find({
            where: { birdId },
            order: { name: 'ASC' },
        });

        const bird = await this.birdRepo.findOne({
            where: { id: birdId },
            select: ['id', 'scientificName', 'commonNames'],
        });

        if (!bird) {
            throw new NotFoundException(`Bird with ID ${birdId} not found`);
        }

        return {
            bird: {
                id: bird.id,
                scientificName: bird.scientificName,
                commonName: bird.commonNames,
            },
            commonNames,
        };
    }

    async addCommonName(birdId: number, createCommonNameDto: any) {
        const bird = await this.findOne(birdId.toString());

        const commonName = this.commonNameRepo.create({
            birdId: bird.id,
            ...createCommonNameDto,
        });

        const saved = await this.commonNameRepo.save(commonName);
        this.logger.log(`Common name added for bird ${birdId}: ${commonName}`);
        return saved;
    }

    /**
     * Media methods
     */
    async getMedia(birdId: number) {
        const bird = await this.birdRepo.findOne({
            where: { id: birdId },
            relations: ['media'],
            select: ['id', 'scientificName', 'commonNames'],
        });

        if (!bird) {
            throw new NotFoundException(`Bird with ID ${birdId} not found`);
        }

        return {
            bird: {
                id: bird.id,
                scientificName: bird.scientificName,
                commonName: bird.commonNames,
            },
            media: bird.media,
        };
    }

    /**
     * Taxonomy methods
     */
    async getTaxonomy(birdId: number) {
        const bird = await this.birdRepo.findOne({
            where: { id: birdId },
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
                commonName: bird.commonNames,
            },
            taxonomy: bird.taxonomy,
        };
    }

    /**
     * Distribution methods
     */
    async getDistributions(birdId: number) {
        const bird = await this.birdRepo.findOne({
            where: { id: birdId },
            relations: ['distributions'],
            select: ['id', 'scientificName', 'commonNames'],
        });

        if (!bird) {
            throw new NotFoundException(`Bird with ID ${birdId} not found`);
        }

        return {
            bird: {
                id: bird.id,
                scientificName: bird.scientificName,
                commonName: bird.commonNames,
            },
            distributions: bird.distributions,
        };
    }
}
