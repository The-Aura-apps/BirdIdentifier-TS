import {
    Injectable,
    NotFoundException,
    ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CommonName } from './entities/common-name.entity';
import { CreateCommonNameDto } from './dto/create-common-name.dto';
import { UpdateCommonNameDto } from './dto/update-common-name.dto';

@Injectable()
export class CommonNamesService {
    constructor(
        @InjectRepository(CommonName)
        private readonly commonNameRepo: Repository<CommonName>,
    ) {}

    async create(createDto: CreateCommonNameDto): Promise<CommonName> {
        // Check for duplicate name for the same bird
        const existing = await this.commonNameRepo.findOne({
            where: {
                birdId: createDto.birdId,
                name: createDto.name,
                language: createDto.language || 'en',
            },
        });

        if (existing) {
            throw new ConflictException(
                'Common name already exists for this bird',
            );
        }

        const commonName = this.commonNameRepo.create(createDto);
        return await this.commonNameRepo.save(commonName);
    }

    async findByBirdId(birdId: number): Promise<CommonName[]> {
        return await this.commonNameRepo.find({
            where: { birdId },
            order: { language: 'ASC', name: 'ASC' },
        });
    }

    async findOne(id: number): Promise<CommonName> {
        const commonName = await this.commonNameRepo.findOne({
            where: { id },
            relations: ['bird'],
        });

        if (!commonName) {
            throw new NotFoundException(`Common name with ID ${id} not found`);
        }

        return commonName;
    }

    async update(
        id: number,
        updateDto: UpdateCommonNameDto,
    ): Promise<CommonName> {
        const commonName = await this.findOne(id);
        Object.assign(commonName, updateDto);
        return await this.commonNameRepo.save(commonName);
    }

    async remove(id: number): Promise<void> {
        const commonName = await this.findOne(id);
        await this.commonNameRepo.remove(commonName);
    }
}
