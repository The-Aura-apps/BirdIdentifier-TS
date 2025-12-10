import { Injectable, NotFoundException, Logger, BadRequestException } from '@nestjs/common';
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

    private validateStatusTransition(from: ObservationStatus, to: ObservationStatus): boolean {
        const validTransitions = {
            [ObservationStatus.PENDING]: [ObservationStatus.PROCESSING],
            [ObservationStatus.PROCESSING]: [ObservationStatus.COMPLETED, ObservationStatus.FAILED],
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
     * Create observation with existing bird data (skip AI processing)
     * Used when reusing results from duplicate file uploads
     */
    async createWithBird(dto: {
        deviceId: string;
        type: 'image' | 'audio';
        uploadId: number;
        birdId: number;
        aiResult: any;
        confidence: number;
    }): Promise<Observation> {
        this.logger.log(
            `Creating observation for device: ${dto.deviceId} with existing bird ID: ${dto.birdId}`
        );

        const observation = this.observationsRepo.create({
            deviceId: dto.deviceId,
            type: dto.type,
            uploadId: dto.uploadId,
            birdId: dto.birdId,
            aiResult: dto.aiResult,
            confidence: dto.confidence,
            status: ObservationStatus.COMPLETED,
        });

        const saved = await this.observationsRepo.save(observation);
        this.logger.log(
            `Observation created with existing bird data: ${saved.id} (bird: ${dto.birdId})`
        );

        // Reload with full bird relations for consistent response
        const fullObservation = await this.observationsRepo.findOne({
            where: { id: saved.id },
            relations: {
                bird: {
                    commonNames: true,
                    taxonomy: true,
                    conservationStatus: true,
                    habitats: true,
                    birdFoods: { food: true },
                    distributions: true,
                    media: true,
                },
                upload: true,
            },
        });

        return fullObservation || saved;
    }

    /**
     * Create observation and process synchronously (WAIT for bird data)
     * Used by upload endpoint to return complete bird data in same response
     */
    async createAndProcessSync(dto: CreateObservationDto): Promise<Observation> {
        this.logger.log(`Creating observation for device: ${dto.deviceId} (SYNCHRONOUS MODE)`);

        // Validate upload exists and has file data
        if (!dto.uploadId) {
            throw new BadRequestException('Upload ID is required');
        }

        const observation = this.observationsRepo.create({
            deviceId: dto.deviceId,
            type: dto.type,
            uploadId: dto.uploadId,
            status: ObservationStatus.PENDING,
        });

        const saved = await this.observationsRepo.save(observation);
        this.logger.log(`Observation created: ${saved.id}, starting synchronous processing...`);

        // Process immediately and WAIT for completion
        await this.processObservation(saved.id);

        // Reload observation with all relations
        const completed = await this.observationsRepo.findOne({
            where: { id: saved.id },
            relations: {
                bird: {
                    commonNames: true,
                    taxonomy: true,
                    conservationStatus: true,
                    habitats: true,
                    birdFoods: { food: true },
                    distributions: true,
                    media: true,
                },
                upload: true,
            },
        });

        if (!completed) {
            throw new NotFoundException(`Observation ${saved.id} not found after processing`);
        }

        this.logger.log(
            `Observation ${completed.id} processed synchronously: status=${completed.status}, bird=${completed.bird?.scientificName || 'none'}`
        );

        return completed;
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
     * Made public to support synchronous processing
     */
    async processObservation(id: string) {
        this.logger.log(`Processing observation: ${id}`);

        const observation = await this.observationsRepo.findOne({
            where: {
                id,
            },
            relations: ['upload'],
        });

        if (!observation) {
            this.logger.warn(`Observation not found for processing: ${id}`);
            return;
        }

        if (!observation.isProcessable()) {
            this.logger.warn(`Observation ${id} not processable, status: ${observation.status}`);
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
            this.logger.error(`Failed to process observation ${id}: ${err.message}`, err.stack);

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
                this.logger.log(`[ObservationService] Calling BirdsService.findOrCreate for: "${aiResponse.result.scientificName}"`);
                
                // Find or create bird with enriched data
                const bird = await this.birdService.findOrCreate(aiResponse.result.scientificName);
                
                this.logger.log(`[ObservationService] Bird obtained from BirdsService: ID ${bird.id}`);

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
            // Low confidence - mark as failed with clear message
            const confidencePercent = ((aiResponse.confidence || 0) * 100).toFixed(1);
            const errorMessage = `Low confidence detection (${confidencePercent}%). Minimum required is 70%. Detected species: ${aiResponse.result?.scientificName || 'Unknown'}`;
            
            this.logger.warn(`Observation ${observation.id}: ${errorMessage}`);
            
            observation.markAsFailed(errorMessage, aiResponse);
        } else {
            // Failed - clear error message
            const errorMessage = aiResponse.error || 'AI processing failed: Unable to identify bird species';
            this.logger.error(`Observation ${observation.id} failed: ${errorMessage}`);
            
            observation.markAsFailed(errorMessage, aiResponse);
        }

        await this.observationsRepo.save(observation);
    }

    async findAll(): Promise<Observation[]> {
        return await this.observationsRepo.find({
            relations: ['bird', 'upload'],
            order: {
                createdAt: 'DESC',
            },
        });
    }

    async findByDevice(deviceId: string): Promise<Observation[]> {
        return await this.observationsRepo.find({
            where: {
                deviceId,
            },
            relations: ['bird', 'upload'],
            order: {
                createdAt: 'DESC',
            },
        });
    }

    async findOne(id: string) {
        return this.observationsRepo.findOne({
            where: { id },
            relations: {
                bird: {
                    commonNames: true,
                    taxonomy: true,
                    habitats: true,
                    birdFoods: { food: true },
                    distributions: true,
                    media: true,
                },
            },
        });
    }

    async update(id: string, partial: Partial<Observation>): Promise<Observation> {
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

        Object.assign(obs, partial, {
            updatedAt: new Date(),
        });
        return this.observationsRepo.save(obs);
    }

    async remove(id: string): Promise<void> {
        const obs = await this.findOne(id);
        await this.observationsRepo.remove(obs);
        this.logger.log(`Observation deleted: ${id}`);
    }
}
