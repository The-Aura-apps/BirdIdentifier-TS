import {
    Injectable,
    NotFoundException,
    Logger,
    BadRequestException,
    ConflictException,
} from '@nestjs/common';
import { CreateBirdDto } from './dto/create-bird.dto';
import { Bird } from './entities/bird.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { UpdateBirdDto } from './dto/update-bird.dto';
import { BirdInfoWrapper } from 'src/modules/ai/wrappers/bird-info.wrapper';
import { BirdInfo } from 'src/modules/ai/types';

@Injectable()
export class BirdsService {
    private readonly logger = new Logger(BirdsService.name);

    constructor(
        @InjectRepository(Bird)
        private readonly birdRepo: Repository<Bird>,
        private readonly birdInfoWrapper: BirdInfoWrapper,
    ) {}

    /**
     * Create a new bird record
     */
    async create(createBirdDto: CreateBirdDto): Promise<Bird> {
        // Validate input
        if (!createBirdDto.scientificName) {
            throw new BadRequestException('Scientific name is required');
        }

        // Check for duplicate
        const existing = await this.birdRepo.findOne({
            where: { scientificName: createBirdDto.scientificName },
        });

        if (existing) {
            throw new ConflictException(
                `Bird with scintific name "${createBirdDto.scientificName}" alredy exists`,
            );
        }

        try {
            const bird = this.birdRepo.create(createBirdDto);
            const saved = await this.birdRepo.save(bird);
            this.logger.log(
                `Bird created ${saved.id} - ${saved.scientificName}`,
            );
            return saved;
        } catch (err) {
            this.logger.error(
                `Failed to create bird: ${err.message}`,
                err.stack,
            );
            throw err;
        }
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
    async findByScientificName(scientificName: string): Promise<Bird | null> {
        if (!scientificName) {
            throw new BadRequestException('Scientific name is required');
        }

        return await this.birdRepo.findOne({
            where: { scientificName },
            relations: ['media', 'commonNames', 'conservationStatus'],
        });
    }

    /**
     * Get all birds
     */
    async findAll(options: {
        page?: number;
        limit?: number;
        sortBy?: string;
        order?: 'ASC' | 'DESC';
    }): Promise<Bird[]> {
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

        return await this.birdRepo.find({
            skip: (page - 1) * limit,
            take: limit,
            order: { [sortBy]: order },
            relations: ['media', 'commonNames', 'conservationStatus'],
        });
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
        delete updateBirdDto['id'];
        delete updateBirdDto['createdAt'];
        delete updateBirdDto['updatedAt'];

        Object.assign(bird, updateBirdDto, { updateAt: new Date() });
        const update = await this.birdRepo.save(bird);
        this.logger.log(`Bird update: ${id} - ${update.scientificName}`);
        return update;
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

        // Normalize scientific name (trim, lowercase for comparison)
        const normalizedName = scientificName.trim();

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

        let birdInfo: BirdInfo | null = null;
        try {
            birdInfo = await this.birdInfoWrapper.fetchInfo(normalizedName);
            this.logger.log(
                `Fetched bird info: ${JSON.stringify(birdInfo, null, 2)}`,
            );
        } catch (err) {
            this.logger.error(
                `Failed to fetch bird info for ${normalizedName}: ${err.message}`,
            );
        }

        if (!bird) {
            this.logger.log(`Creating new bird record: ${normalizedName}`);
            bird = this.birdRepo.create({
                scientificName: normalizedName,

            });

            bird = await this.birdRepo.save(bird);
            this.logger.log(
                `Bird created: ${bird.id} - ${bird.scientificName}`,
            );
        }
        // Check if bird data is incomplete (missing any key fields)
        if (
            !bird.commonName ||
            !bird.photos ||
            !bird.features ||
            !bird.ecology ||
            !bird.geography ||
            !bird.education
        ) {
            this.logger.log(`Enriching bird data for: ${normalizedName}`);
            try {
                const birdInfo: BirdInfo =
                    await this.birdInfoWrapper.fetchInfo(normalizedName);
                this.logger.log(
                    `Fetched bird info: ${JSON.stringify(birdInfo, null, 2)}`,
                );
                bird = await this.update(bird.id, {});
            } catch (err) {
                this.logger.error(
                    `Failed to enrich bird data for ${normalizedName}: ${err.message}`,
                );
                // Continue with existing bird data to avoid blocking
            }
        } else {
            this.logger.log(
                `Bird data already complete for: ${normalizedName}`,
            );
        }
        return bird;
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
}
