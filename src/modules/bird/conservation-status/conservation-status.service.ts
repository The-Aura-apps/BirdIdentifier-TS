// conservation-status/conservation-status.service.ts
import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
    ConservationStatus,
    ConservationStatusCode,
} from './entities/conservation-status.entity';
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
    async findOrCreate(
        dto: CreateConservationStatusDto,
    ): Promise<ConservationStatus | null> {
        const { code } = dto;

        // Try to find existing conservation status
        let conservationStatus = await this.conservationStatusRepo.findOne({
            where: { code },
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
                    where: { code },
                });
            }
            throw error;
        }
    }

    /**
     * Find conservation status by code
     */
    async findByCode(
        code: ConservationStatusCode,
    ): Promise<ConservationStatus | null> {
        return this.conservationStatusRepo.findOne({
            where: { code },
        });
    }

    /**
     * Get all conservation statuses
     */
    async findAll(): Promise<ConservationStatus[]> {
        return this.conservationStatusRepo.find({
            order: { severityLevel: 'DESC' }, // Most threatened first
        });
    }

    /**
     * Seed default conservation statuses
     */
    // async seedDefaultStatuses(): Promise<void> {
    //     const defaultStatuses = [
    //         {
    //             code: ConservationStatusCode.EX,
    //             fullName: 'Extinct',
    //             description: 'No known individuals remaining',
    //             severityLevel: 9,
    //             authority: 'IUCN',
    //         },
    //         {
    //             code: ConservationStatusCode.EW,
    //             fullName: 'Extinct in the Wild',
    //             description: 'Known only to survive in captivity',
    //             severityLevel: 8,
    //             authority: 'IUCN',
    //         },
    //         {
    //             code: ConservationStatusCode.CR,
    //             fullName: 'Critically Endangered',
    //             description: 'Extremely high risk of extinction',
    //             severityLevel: 7,
    //             authority: 'IUCN',
    //         },
    //         {
    //             code: ConservationStatusCode.EN,
    //             fullName: 'Endangered',
    //             description: 'High risk of extinction',
    //             severityLevel: 6,
    //             authority: 'IUCN',
    //         },
    //         {
    //             code: ConservationStatusCode.VU,
    //             fullName: 'Vulnerable',
    //             description: 'High risk of endangerment',
    //             severityLevel: 5,
    //             authority: 'IUCN',
    //         },
    //         {
    //             code: ConservationStatusCode.NT,
    //             fullName: 'Near Threatened',
    //             description: 'Likely to become endangered soon',
    //             severityLevel: 4,
    //             authority: 'IUCN',
    //         },
    //         {
    //             code: ConservationStatusCode.LC,
    //             fullName: 'Least Concern',
    //             description: 'Lowest risk category',
    //             severityLevel: 3,
    //             authority: 'IUCN',
    //         },
    //         {
    //             code: ConservationStatusCode.DD,
    //             fullName: 'Data Deficient',
    //             description: 'Inadequate information to assess',
    //             severityLevel: 2,
    //             authority: 'IUCN',
    //         },
    //         {
    //             code: ConservationStatusCode.NE,
    //             fullName: 'Not Evaluated',
    //             description: 'Not yet evaluated',
    //             severityLevel: 1,
    //             authority: 'IUCN',
    //         },
    //     ];

    //     for (const statusData of defaultStatuses) {
    //         await this.findOrCreate(statusData);
    //     }
    // }
}
