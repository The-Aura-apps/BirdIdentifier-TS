import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BirdDistribution } from './entities/bird-distribution.entity';
import { CreateBirdDistributionDto } from './dto/create-bird-distribution.dto';
import { UpdateBirdDistributionDto } from './dto/update-bird-distribution.dto';
import { Bird } from '../birds/entities/bird.entity';
import { CreateBirdDto } from '../birds/dto/create-bird.dto';

@Injectable()
export class BirdDistributionService {
    private readonly logger = new Logger(BirdDistributionService.name);

    constructor(
        @InjectRepository(BirdDistribution)
        private readonly distributionRepo: Repository<BirdDistribution>,
        @InjectRepository(Bird)
        private readonly birdRepo: Repository<Bird>,
    ) {}

    async create(createDto: CreateBirdDistributionDto): Promise<BirdDistribution> {
        const bird = await this.birdRepo.findOne({
            where: { id: createDto.birdId },
        });

        if (!bird) {
            throw new NotFoundException(`Bird with Id ${createDto.birdId} not found`);
        }

        const existing = await this.distributionRepo.findOne({
            where: {
                bird: { id: createDto.birdId },
                season: createDto.season,
                month: createDto.month,
            },
        });

        if (existing) {
            throw new ConflictException('Distribution for this bird and season already exists');
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
        this.logger.log(`Distribution created for bird ${createDto.birdId}`);
        return saved;
    }

    async findByBirdId(birdId: number): Promise<BirdDistribution[]> {
        const bird = await this.birdRepo.findOne({
            where: { id: birdId },
        });

        if (!bird) {
            throw new NotFoundException(`Bird with ID ${birdId} not found`);
        }

        return await this.distributionRepo.find({
            where: { bird: { id: birdId } },
            order: {
                month: 'ASC',
                season: 'ASC',
            },
        });
    }
    async findOne(id: number): Promise<BirdDistribution> {
        const distribution = await this.distributionRepo.findOne({
            where: { id },
            relations: ['bird'],
        });

        if (!distribution) {
            throw new NotFoundException(`Distribution with ID ${id} not found`);
        }

        return distribution;
    }

    async update(id: number, updateDto: UpdateBirdDistributionDto): Promise<BirdDistribution> {
        const distribution = await this.findOne(id);

        // Check for duplicate if updating season/month
        if (updateDto.season || updateDto.month) {
            const existing = await this.distributionRepo.findOne({
                where: {
                    bird: { id: distribution.bird.id },
                    season: updateDto.season || distribution.season,
                    month: updateDto.month || distribution.month,
                },
            });

            if (existing && existing.id !== id) {
                throw new ConflictException(
                    `Distribution for this season and month already exists`,
                );
            }
        }

        Object.assign(distribution, updateDto);
        const updated = await this.distributionRepo.save(distribution);
        this.logger.log(`Distribution ${id} updated`);
        return updated;
    }

    async remove(id: number): Promise<void> {
        const distribution = await this.findOne(id);
        await this.distributionRepo.remove(distribution);
        this.logger.log(`Distribution ${id} deleted`);
    }
}
