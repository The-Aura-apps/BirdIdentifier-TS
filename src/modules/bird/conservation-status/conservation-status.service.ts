import {
    Injectable,
    NotFoundException,
    ConflictException,
    Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConservationStatus } from './entities/conservation-status.entity';
import { CreateConservationStatusDto } from './dto/create-conservation-status.dto';
import { UpdateConservationStatusDto } from './dto/update-conservation-status.dto';

@Injectable()
export class ConservationStatusService {
    private readonly logger = new Logger(ConservationStatusService.name);

    constructor(
        @InjectRepository(ConservationStatus)
        private readonly conservationStatusRepo: Repository<ConservationStatus>,
    ) {}

    async create(
        createDto: CreateConservationStatusDto,
    ): Promise<ConservationStatus> {
        // Check for duplicate code
        const existing = await this.conservationStatusRepo.findOne({
            where: { code: createDto.code },
        });

        if (existing) {
            throw new ConflictException(
                `Conservation status with code "${createDto.code}" already exists`,
            );
        }

        const status = this.conservationStatusRepo.create(createDto);
        const saved = await this.conservationStatusRepo.save(status);

        this.logger.log(
            `Conservation status created: ${saved.code} - ${saved.fullName}`,
        );
        return saved;
    }

    async findAll(
        options: { page?: number; limit?: number } = {},
    ): Promise<{ data: ConservationStatus[]; total: number }> {
        const { page = 1, limit = 20 } = options;

        const [data, total] = await this.conservationStatusRepo.findAndCount({
            skip: (page - 1) * limit,
            take: limit,
            order: { id: 'ASC' },
        });

        return { data, total };
    }

    async findOne(id: number): Promise<ConservationStatus> {
        const status = await this.conservationStatusRepo.findOne({
            where: { id },
        });

        if (!status) {
            throw new NotFoundException(
                `Conservation status with ID ${id} not found`,
            );
        }

        return status;
    }

    async findByCode(code: string): Promise<ConservationStatus> {
        const status = await this.conservationStatusRepo.findOne({
            where: { code },
        });

        if (!status) {
            throw new NotFoundException(
                `Conservation status with code "${code}" not found`,
            );
        }

        return status;
    }

    async update(
        id: number,
        updateDto: UpdateConservationStatusDto,
    ): Promise<ConservationStatus> {
        const status = await this.findOne(id);

        // Check for code conflict if updating code
        if (updateDto.code && updateDto.code !== status.code) {
            const existing = await this.conservationStatusRepo.findOne({
                where: { code: updateDto.code },
            });

            if (existing) {
                throw new ConflictException(
                    `Conservation status with code "${updateDto.code}" already exists`,
                );
            }
        }

        Object.assign(status, updateDto);
        const updated = await this.conservationStatusRepo.save(status);

        this.logger.log(
            `Conservation status updated: ${updated.id} - ${updated.code}`,
        );
        return updated;
    }

    async remove(id: number): Promise<void> {
        const status = await this.findOne(id);

        // Check if any birds are using this status
        const birdsCount = await this.conservationStatusRepo
            .createQueryBuilder('status')
            .innerJoin('status.birds', 'bird')
            .where('status.id = :id', { id })
            .getCount();

        if (birdsCount > 0) {
            throw new ConflictException(
                `Cannot delete conservation status ${id}: ${birdsCount} birds are using it`,
            );
        }

        await this.conservationStatusRepo.remove(status);
        this.logger.log(`Conservation status deleted: ${id}`);
    }
}
