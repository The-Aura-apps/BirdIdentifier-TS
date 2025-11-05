import {
    Injectable,
    NotFoundException,
    ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BirdDistribution } from './entities/bird-distribution.entity';
import { CreateBirdDistributionDto } from './dto/create-bird-distribution.dto';
import { UpdateBirdDistributionDto } from './dto/update-bird-distribution.dto';

@Injectable()
export class BirdDistributionService {
    constructor(
        @InjectRepository(BirdDistribution)
        private readonly distributionRepo: Repository<BirdDistribution>
    ) {}

    async create(
        createDto: CreateBirdDistributionDto
    ): Promise<BirdDistribution> {
        const existing = await this.distributionRepo.findOne({
            where: {
                birdId: createDto.birdId,
                season: createDto.season,
            },
        });

        if (existing) {
            throw new ConflictException(
                'Distribution for this bird and season already exists'
            );
        }

        const distribution = this.distributionRepo.create(createDto);
        return await this.distributionRepo.save(distribution);
    }

    async findByBirdId(birdId: number): Promise<BirdDistribution[]> {
        return await this.distributionRepo.find({
            where: {
                birdId,
            },
            order: {
                season: 'ASC',
            },
        });
    }

    async findOne(id: number): Promise<BirdDistribution> {
        const distribution = await this.distributionRepo.findOne({
            where: {
                id,
            },
            relations: ['bird'],
        });

        if (!distribution) {
            throw new NotFoundException(`Distribution with ID ${id} not found`);
        }

        return distribution;
    }

    async update(
        id: number,
        updateDto: UpdateBirdDistributionDto
    ): Promise<BirdDistribution> {
        const distribution = await this.findOne(id);
        Object.assign(distribution, updateDto);
        return await this.distributionRepo.save(distribution);
    }

    async remove(id: number): Promise<void> {
        const distribution = await this.findOne(id);
        await this.distributionRepo.remove(distribution);
    }
}
