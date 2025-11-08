import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Media } from './entities/media.entity';
import { CreateMediaDto } from './dto/create-media.dto';
import { UpdateMediaDto } from './dto/update-media.dto';
import { Bird } from '../bird/birds/entities/bird.entity';

@Injectable()
export class MediaService {
    private readonly logger = new Logger(MediaService.name);

    constructor(
        @InjectRepository(Media)
        private readonly mediaRepo: Repository<Media>,
        @InjectRepository(Bird)
        private readonly birdRepo: Repository<Bird>,
    ) {}

    async create(createDto: CreateMediaDto): Promise<Media> {
        // Verify bird exists
        const bird = await this.birdRepo.findOne({
            where: { id: createDto.birdId },
        });

        if (!bird) {
            throw new NotFoundException(`Bird with ID ${createDto.birdId} not found`);
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
        this.logger.log(`Media created: ${saved.id} for bird ${createDto.birdId}`);
        return saved;
    }

    async findAll(options: { page?: number; limit?: number } = {}): Promise<{
        data: Media[];
        total: number;
    }> {
        const { page = 1, limit = 20 } = options;

        const [data, total] = await this.mediaRepo.findAndCount({
            skip: (page - 1) * limit,
            take: limit,
            order: {
                createdAt: 'DESC',
            },
            relations: ['bird'],
        });

        return { data, total };
    }

    async findOne(id: number): Promise<Media> {
        const media = await this.mediaRepo.findOne({
            where: { id },
            relations: ['bird'],
        });

        if (!media) {
            throw new NotFoundException(`Media with ID ${id} not found`);
        }

        return media;
    }

    async findByBirdId(birdId: number): Promise<Media[]> {
        const bird = await this.birdRepo.findOne({
            where: { id: birdId },
        });

        if (!bird) {
            throw new NotFoundException(`Bird with ID ${birdId} not found`);
        }

        return await this.mediaRepo.find({
            where: { bird: { id: birdId } },
            order: {
                orderIndex: 'ASC',
                createdAt: 'ASC',
            },
        });
    }

    async findByType(birdId: number, type: string): Promise<Media[]> {
        return await this.mediaRepo.find({
            where: {
                bird: { id: birdId },
                type: type as any,
            },
            order: {
                orderIndex: 'ASC',
            },
        });
    }

    async update(id: number, updateDto: UpdateMediaDto): Promise<Media> {
        const media = await this.findOne(id);

        Object.assign(media, updateDto);
        const updated = await this.mediaRepo.save(media);

        this.logger.log(`Media updated: ${id}`);
        return updated;
    }

    async remove(id: number): Promise<void> {
        const media = await this.findOne(id);
        await this.mediaRepo.remove(media);
        this.logger.log(`Media deleted: ${id}`);
    }

    async reorder(birdId: number, mediaIds: number[]): Promise<Media[]> {
        const bird = await this.birdRepo.findOne({
            where: { id: birdId },
        });

        if (!bird) {
            throw new NotFoundException(`Bird with ID ${birdId} not found`);
        }

        // Fetch all media items
        const mediaItems = await this.mediaRepo.find({
            where: { bird: { id: birdId } },
        });

        // Update order indices
        const updates = mediaIds
            .map((id, index) => {
                const media = mediaItems.find((m) => m.id === id);
                if (media) {
                    media.orderIndex = index;
                    return this.mediaRepo.save(media);
                }
                return null;
            })
            .filter(Boolean);

        await Promise.all(updates);
        this.logger.log(`Media reordered for bird ${birdId}`);

        // Return updated list
        return await this.findByBirdId(birdId);
    }
}
