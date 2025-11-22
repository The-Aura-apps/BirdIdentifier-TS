// conservation-status/conservation-status.service.ts
import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConservationStatus, ConservationStatusCode } from './entities/conservation-status.entity';
import { CreateConservationStatusDto } from './dto/create-conservation-status.dto';

@Injectable()
export class ConservationStatusService {
    constructor(
        @InjectRepository(ConservationStatus)
        private readonly conservationStatusRepo: Repository<ConservationStatus>,
    ) {}

    /**
     * Find conservation status by code or create if not exists
     */
    async findOrCreate(dto: CreateConservationStatusDto): Promise<ConservationStatus | null> {
        const { code } = dto;

        // Try to find existing conservation status
        let conservationStatus = await this.conservationStatusRepo.findOne({
            where: {
                code,
            },
        });

        if (conservationStatus) {
            return conservationStatus;
        }

        // Create new conservation status
        conservationStatus = this.conservationStatusRepo.create(dto);

        try {
            return await this.conservationStatusRepo.save(conservationStatus);
        } catch (error) {
            // Handle race condition where another request might have created it
            if (error.code === '23505') {
                // Unique violation
                return await this.conservationStatusRepo.findOne({
                    where: {
                        code,
                    },
                });
            }
            throw error;
        }
    }

    /**
     * Find conservation status by code
     */
    async findByCode(code: ConservationStatusCode): Promise<ConservationStatus | null> {
        return this.conservationStatusRepo.findOne({
            where: {
                code,
            },
        });
    }

    /**
     * Get all conservation statuses
     */
    async findAll(): Promise<ConservationStatus[]> {
        return this.conservationStatusRepo.find({
            order: {
                severityLevel: 'DESC',
            }, // Most threatened first
        });
    }
}
