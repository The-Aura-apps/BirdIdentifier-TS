import {
    Injectable,
    NotFoundException,
    ConflictException,
    Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Habitat } from './entities/habitat.entity';
import { CreateHabitatDto } from './dto/create-habitat.dto';
import { UpdateHabitatDto } from './dto/update-habitat.dto';

@Injectable()
export class HabitatService {
    private readonly logger = new Logger(HabitatService.name);

    constructor(
        @InjectRepository(Habitat)
        private readonly habitatRepo: Repository<Habitat>
    ) {}

    async create(createDto: CreateHabitatDto): Promise<Habitat> {
        const existing = await this.habitatRepo.findOne({
            where: {
                name: createDto.name,
            },
        });

        if (existing) {
            throw new ConflictException(
                `Habitat with name "${createDto.name}" already exists`
            );
        }

        const habitat = this.habitatRepo.create(createDto);
        const saved = await this.habitatRepo.save(habitat);

        this.logger.log(`Habitat created: ${saved.id} - ${saved.name}`);
        return saved;
    }

    async findAll(
        options: {
            page?: number;
            limit?: number;
        } = {}
    ): Promise<{
        data: Habitat[];
        total: number;
    }> {
        const { page = 1, limit = 20 } = options;

        const [data, total] = await this.habitatRepo.findAndCount({
            skip: (page - 1) * limit,
            take: limit,
            order: {
                name: 'ASC',
            },
        });

        return {
            data,
            total,
        };
    }

    async findOne(id: number): Promise<Habitat> {
        const habitat = await this.habitatRepo.findOne({
            where: {
                id,
            },
            relations: ['birds'],
        });

        if (!habitat) {
            throw new NotFoundException(`Habitat with ID ${id} not found`);
        }

        return habitat;
    }

    async findByName(name: string): Promise<Habitat> {
        const habitat = await this.habitatRepo.findOne({
            where: {
                name,
            },
            relations: ['birds'],
        });

        if (!habitat) {
            throw new NotFoundException(
                `Habitat with name "${name}" not found`
            );
        }

        return habitat;
    }

    async update(id: number, updateDto: UpdateHabitatDto): Promise<Habitat> {
        const habitat = await this.findOne(id);

        if (updateDto.name && updateDto.name !== habitat.name) {
            const existing = await this.habitatRepo.findOne({
                where: {
                    name: updateDto.name,
                },
            });

            if (existing) {
                throw new ConflictException(
                    `Habitat with name "${updateDto.name}" already exists`
                );
            }
        }

        Object.assign(habitat, updateDto);
        const updated = await this.habitatRepo.save(habitat);

        this.logger.log(`Habitat updated: ${updated.id} - ${updated.name}`);
        return updated;
    }

    async remove(id: number): Promise<void> {
        const habitat = await this.findOne(id);

        // Check if any birds are associated with this habitat
        const birdsCount = await this.habitatRepo
            .createQueryBuilder('habitat')
            .innerJoin('habitat.birds', 'bird')
            .where('habitat.id = :id', {
                id,
            })
            .getCount();

        if (birdsCount > 0) {
            throw new ConflictException(
                `Cannot delete habitat ${id}: ${birdsCount} birds are associated with it`
            );
        }

        await this.habitatRepo.remove(habitat);
        this.logger.log(`Habitat deleted: ${id}`);
    }

    async getBirds(id: number) {
        const habitat = await this.habitatRepo.findOne({
            where: {
                id,
            },
            relations: ['birds', 'birds.conservationStatus', 'birds.media'],
        });

        if (!habitat) {
            throw new NotFoundException(`Habitat with ID ${id} not found`);
        }

        return {
            habitat: {
                id: habitat.id,
                name: habitat.name,
                description: habitat.description,
            },
            birds: habitat.birds,
        };
    }
}
