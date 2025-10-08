import {
    Injectable,
    NotFoundException,
    Logger,
    BadRequestException,
} from "@nestjs/common";
import { Observation, ObservationStatus } from "./entities/observation.entity";
import { Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { BirdsService } from "src/birds/birds.service";
import { AiService } from "src/ai/ai.service";
import { CreateObservationDto } from "./dto/create-observation.dto";
import { Upload } from "src/uploads/entities/upload.entity";
import { BirdAiResponse } from "src/ai/types";

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
            // COMPLETED and FAILED are terminal states - no transitions allowed
        };
        return validTransitions[from]?.includes(to) ?? false;
    }

    // Create Observation from API input (client)
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
                this.logger.error(
                    `Unhandled error in processObservation: ${err.message}`,
                );
            });
        });
        return saved;
    }

    private async updateResult(
        observation: Observation,
        aiResponse: BirdAiResponse,
    ): Promise<void> {
        observation.result = aiResponse;

        if (aiResponse.status === "identified") {
            const bird = await this.birdService.findOrCreate(
                aiResponse.result.scientificName,
            );
            observation.status = ObservationStatus.COMPLETED;
            observation.bird = bird;
        } else {
            observation.status =
                aiResponse.status === "uncertain"
                    ? ObservationStatus.COMPLETED
                    : ObservationStatus.FAILED;
            observation.bird = null;
        }

        await this.observationsRepo.save(observation);
    }

    //AI processing for an observation
    private async processObservation(id: string) {
        this.logger.log(`Processing observation: ${id}`);

        // Loads the observation WITH the full upload data (including file_data buffer)
        //observation: Observation   --> id: string
        const observation = await this.observationsRepo.findOne({
            where: { id },
            relations: ["upload"], // ← Now loads full Upload entity
        });

        if (!observation) {
            this.logger.warn(`Observation not found for processing: ${id}`);
            return;
        }

        // Prevent re-processing
        if (observation.status !== ObservationStatus.PENDING) {
            this.logger.warn(
                `Observation ${id} already processed, status: ${observation.status}`,
            );
            return;
        }

        try {
            observation.status = ObservationStatus.PROCESSING;
            await this.observationsRepo.save(observation);
            //Ask AI for scientific name
            const aiResponse = await this.aiService.process(
                observation.upload.file_data,
                observation.type,
            );

            await this.updateResult(observation, aiResponse); // Updates with AI results
            this.logger.log(`Observation processed successfully: ${id}`);
        } catch (err) {
            this.logger.error(
                `Failed to process observation ${id}: ${err.message}`,
                err.stack,
            );
            observation.status = ObservationStatus.FAILED;
            await this.observationsRepo.save(observation);
        }
    }

    async findAll(): Promise<Observation[]> {
        return await this.observationsRepo.find();
    }

    /*   async findAll(): Promise<Observation[]> {
    return await this.observationsRepo.find({
      order: { createdAt: 'DESC' },
      take: 100, // Limit for MVP performance
      relations: ['bird'], // Load bird but not upload
    });
  } */

    async findByDevice(deviceId: string): Promise<Observation[]> {
        return await this.observationsRepo.find({
            where: { deviceId },
            //order: { createdAt: 'DESC' },
            relations: ["bird"], // Only load bird, not upload
        });
    }

    async findOne(id: string): Promise<Observation> {
        const observation = await this.observationsRepo.findOneBy({ id });
        if (!observation) {
            throw new NotFoundException(`Observation ${id} not found`);
        }
        return observation;
    }

    //Update observation (with status transition validation)
    async update(
        id: string,
        partial: Partial<Observation>,
    ): Promise<Observation> {
        const obs = await this.findOne(id);

        // Validate status transition if status is being updated
        if (partial.status && partial.status !== obs.status) {
            if (!this.validateStatusTransition(obs.status, partial.status)) {
                throw new BadRequestException(
                    `Invalid status transition from ${obs.status} to ${partial.status}`,
                );
            }
        }

        // Prevent manual updates to certain fields
        delete partial["id"];
        delete partial["createdAt"];
        delete partial["uploadId"]; // FK should not be changed manually

        Object.assign(obs, partial, { updatedAt: new Date() });
        return this.observationsRepo.save(obs);
    }

    async remove(id: string): Promise<void> {
        const obs = await this.findOne(id);
        await this.observationsRepo.remove(obs);
        this.logger.log(`Observation deleted: ${id}`);
    }
}
