import {
    Injectable,
    NotFoundException,
    Logger,
    BadRequestException,
} from '@nestjs/common';
import { Observation, ObservationStatus } from './entities/observation.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { BirdsService } from 'src/modules/bird/birds/birds.service';
import { AiService } from 'src/modules/ai/ai.service';
import { CreateObservationDto } from './dto/create-observation.dto';
import { BirdAiResponse, isIdentified, isFailed } from 'src/modules/ai/types';

@Injectable()
export class ObservationsService {
    private readonly logger = new Logger(ObservationsService.name);

    constructor(
        @InjectRepository(Observation)
        private readonly observationsRepo: Repository<Observation>,
        private readonly aiService: AiService,
        private readonly birdService: BirdsService,
    ) {}

    private validateStatusTransition(
        from: ObservationStatus,
        to: ObservationStatus,
    ): boolean {
        const validTransitions = {
            [ObservationStatus.PENDING]: [ObservationStatus.PROCESSING],
            [ObservationStatus.PROCESSING]: [
                ObservationStatus.COMPLETED,
                ObservationStatus.FAILED,
            ],
            [ObservationStatus.COMPLETED]: [],
            //    [ObservationStatus.FAILED]: [ObservationStatus.PENDING], // Allow retries func is commented in butt
        };
        return validTransitions[from]?.includes(to) ?? false;
    }

    /**
     * Create an observation from API input
     */
    async create(dto: CreateObservationDto): Promise<Observation> {
        this.logger.log(`Creating observation for device: ${dto.deviceId}`);

        // Validate upload exists and has file data
        if (!dto.uploadId) {
            throw new BadRequestException('Upload ID is required');
        }

        const observation = this.observationsRepo.create({
            deviceId: dto.deviceId,
            type: dto.type,
            uploadId: dto.uploadId, // Use direct foreign key assignment
            status: ObservationStatus.PENDING,
        });

        const saved = await this.observationsRepo.save(observation);
        this.logger.log(`Observation created: ${saved.id}`);

        // Start background processing
        this.processObservationBackground(saved.id).catch((err) => {
            this.logger.error(
                `Background processing failed for observation ${saved.id}: ${err.message}`,
            );
        });

        return saved;
    }

    /**
     * Process observation in background
     */
    private async processObservationBackground(id: string): Promise<void> {
        // Small delay to ensure the initial response is sent
        await new Promise((resolve) => setTimeout(resolve, 100));

        try {
            await this.processObservation(id);
        } catch (error) {
            this.logger.error(
                `Unhandled error in background processing: ${error.message}`,
                error.stack,
            );
        }
    }

    /**
     * Process observation with AI
     */
    private async processObservation(id: string) {
        this.logger.log(`Processing observation: ${id}`);

        const observation = await this.observationsRepo.findOne({
            where: { id },
            relations: ['upload'],
        });

        if (!observation) {
            this.logger.warn(`Observation not found for processing: ${id}`);
            return;
        }

        if (!observation.isProcessable()) {
            this.logger.warn(
                `Observation ${id} not processable, status: ${observation.status}`,
            );
            return;
        }

        try {
            // Mark as processing
            observation.markAsProcessing();
            await this.observationsRepo.save(observation);

            // Validate upload has file data
            if (!observation.upload?.fileData) {
                throw new Error('Upload has no file data');
            }

            const aiResponse = await this.aiService.process(
                observation.upload.fileData,
                observation.type,
            );

            await this.handleAiResponse(observation, aiResponse);
            this.logger.log(`Observation processed successfully: ${id}`);
        } catch (err) {
            this.logger.error(
                `Failed to process observation ${id}: ${err.message}`,
                err.stack,
            );

            await this.observationsRepo.update(id, {
                status: ObservationStatus.FAILED,
                errorMessage: err.message,
                updatedAt: new Date(),
            });
        }
    }

    /**
     * Handle AI response and update observation
     */
    private async handleAiResponse(
        observation: Observation,
        aiResponse: BirdAiResponse,
    ): Promise<void> {
        if (isIdentified(aiResponse)) {
            try {
                // Find or create bird with enriched data
                const bird = await this.birdService.findOrCreate(
                    aiResponse.result.scientificName,
                );

                observation.markAsCompleted(bird, aiResponse);
            } catch (birdError) {
                this.logger.error(
                    `Failed to process bird for observation ${observation.id}: ${birdError.message}`,
                );
                observation.markAsFailed(
                    `Bird processing failed: ${birdError.message}`,
                    aiResponse,
                );
            }
        } else if (aiResponse.status === 'uncertain') {
            // Store uncertain result but don't link to a bird
            observation.status = ObservationStatus.COMPLETED;
            observation.aiResult = aiResponse;
            observation.confidence = aiResponse.confidence;
            observation.bird = null;
            observation.birdId = null;
        } else {
            // Failed
            observation.markAsFailed(
                aiResponse.error || 'AI processing failed',
                aiResponse,
            );
        }

        await this.observationsRepo.save(observation);
    }

    async findAll(): Promise<Observation[]> {
        return await this.observationsRepo.find({
            relations: ['bird', 'upload'],
            order: { createdAt: 'DESC' },
        });
    }

    async findByDevice(deviceId: string): Promise<Observation[]> {
        return await this.observationsRepo.find({
            where: { deviceId },
            relations: ['bird', 'upload'],
            order: { createdAt: 'DESC' },
        });
    }

    async findOne(id: string): Promise<Observation> {
        const observation = await this.observationsRepo.findOne({
            where: { id },
            relations: ['bird', 'upload'],
        });

        if (!observation) {
            throw new NotFoundException(`Observation ${id} not found`);
        }
        return observation;
    }

    async update(
        id: string,
        partial: Partial<Observation>,
    ): Promise<Observation> {
        const obs = await this.findOne(id);

        if (partial.status && partial.status !== obs.status) {
            if (!this.validateStatusTransition(obs.status, partial.status)) {
                throw new BadRequestException(
                    `Invalid status transition from ${obs.status} to ${partial.status}`,
                );
            }
        }

        delete partial['id'];
        delete partial['createdAt'];
        delete partial['uploadId'];

        Object.assign(obs, partial, { updatedAt: new Date() });
        return this.observationsRepo.save(obs);
    }

    async remove(id: string): Promise<void> {
        const obs = await this.findOne(id);
        await this.observationsRepo.remove(obs);
        this.logger.log(`Observation deleted: ${id}`);
    }

    // async update(
    //     id: string,
    //     partial: Partial<Observation>,
    // ): Promise<Observation> {
    //     const observation = await this.findOne(id);

    //     if (partial.status && partial.status !== observation.status) {
    //         if (
    //             !this.validateStatusTransition(
    //                 observation.status,
    //                 partial.status,
    //             )
    //         ) {
    //             throw new BadRequestException(
    //                 `Invalid status transition from ${observation.status} to ${partial.status}`,
    //             );
    //         }
    //     }

    //     // Prevent manual updates to protected fields
    //     const { id: _, createdAt, uploadId, ...safeUpdates } = partial;

    //     Object.assign(observation, safeUpdates, { updatedAt: new Date() });
    //     return this.observationsRepo.save(observation);
    // }

    // async retry(id: string): Promise<Observation> {
    //     const observation = await this.findOne(id);

    //     if (observation.status !== ObservationStatus.FAILED) {
    //         throw new BadRequestException('Can only retry failed observations');
    //     }

    //     observation.status = ObservationStatus.PENDING;
    //     observation.errorMessage = null;
    //     const updated = await this.observationsRepo.save(observation);

    //     // Restart processing
    //     this.processObservationBackground(id).catch((err) => {
    //         this.logger.error(
    //             `Retry failed for observation ${id}: ${err.message}`,
    //         );
    //     });

    //     return updated;
    // }
}
