import { Injectable, NotFoundException, Logger, BadRequestException } from '@nestjs/common';
import { Observation, ObservationStatus } from './entities/observation.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { BirdsService } from 'src/modules/bird/birds/birds.service';
import { AiService } from 'src/modules/ai/ai.service';
import { CreateObservationDto } from './dto/create-observation.dto';
import { Upload } from 'src/modules/uploads/entities/upload.entity';
import { BirdAiResponse } from 'src/modules/ai/types';

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
        };
        return validTransitions[from]?.includes(to) ?? false;
    }

    /**
     * Create an observation from API input
     */
    async create(dto: CreateObservationDto): Promise<Observation> {
        this.logger.log(`Creating observation for device: ${dto.deviceId}`);

        const observation = this.observationsRepo.create({
            deviceId: dto.deviceId,
            type: dto.type,
            upload: { id: dto.uploadId } as Upload, // link without loading full entity ,  // ← Partial object, not full Upload
            status: ObservationStatus.PENDING, // UploadsService → call with uploadId, bservationsService → convert uploadId → upload relation
        });

        const saved = await this.observationsRepo.save(observation);
        this.logger.log(`Observation created: ${saved.id}`);

        setImmediate(() => {
            this.processObservation(saved.id).catch((err) => {
                this.logger.error(`Unhandled error in processObservation: ${err.message}`);
            });
        });
        return saved;
    }
    /**
     * Update observation with AI results
     */
    private async updateResult(
        observation: Observation,
        aiResponse: BirdAiResponse,
    ): Promise<void> {
        if (aiResponse.status === 'identified') {
            const bird = await this.birdService.findOrCreate(aiResponse.result.scientificName); // This now enriches bird data
            observation.status = ObservationStatus.COMPLETED;
            observation.bird = bird;
        } else {
            observation.status =
                aiResponse.status === 'uncertain'
                    ? ObservationStatus.COMPLETED
                    : ObservationStatus.FAILED;
            observation.bird = null;
        }

        await this.observationsRepo.save(observation);
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

        if (observation.status !== ObservationStatus.PENDING) {
            this.logger.warn(`Observation ${id} already processed, status: ${observation.status}`);
            return;
        }

        try {
            observation.status = ObservationStatus.PROCESSING;
            await this.observationsRepo.save(observation);

            const aiResponse = await this.aiService.process(
                observation.upload.file_data,
                observation.type,
            );

            await this.updateResult(observation, aiResponse);
            this.logger.log(`Observation processed successfully: ${id}`);
        } catch (err) {
            this.logger.error(`Failed to process observation ${id}: ${err.message}`, err.stack);
            observation.status = ObservationStatus.FAILED;
            await this.observationsRepo.save(observation);
        }
    }

    async findAll(): Promise<Observation[]> {
        return await this.observationsRepo.find({
            relations: ['bird'],
        });
    }

    async findByDevice(deviceId: string): Promise<Observation[]> {
        return await this.observationsRepo.find({
            where: { deviceId },
            relations: ['bird'],
        });
    }

    async findOne(id: string): Promise<Observation> {
        const observation = await this.observationsRepo.findOneBy({ id });
        if (!observation) {
            throw new NotFoundException(`Observation ${id} not found`);
        }
        return observation;
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

        Object.assign(obs, partial, { updatedAt: new Date() });
        return this.observationsRepo.save(obs);
    }

    async remove(id: string): Promise<void> {
        const obs = await this.findOne(id);
        await this.observationsRepo.remove(obs);
        this.logger.log(`Observation deleted: ${id}`);
    }
}
