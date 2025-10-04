import { Injectable, NotFoundException } from '@nestjs/common';
import { Observation } from './entities/observation.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { BirdsService } from 'src/birds/birds.service';
import { AiService } from 'src/ai/ai.service';
import { CreateObservationDto } from './dto/create-observation.dto';
import { Upload } from 'src/uploads/entities/upload.entity';
import { BirdAiResponse } from 'src/ai/types';

@Injectable()
export class ObservationsService {
  constructor(
    @InjectRepository(Observation)
    private readonly observationsRepo: Repository<Observation>,
    private readonly aiService: AiService,
    private readonly birdService: BirdsService,
  ) {}

  // Create Observation from API input (client)
  async create(dto: CreateObservationDto): Promise<Observation> {
    const observation = this.observationsRepo.create({
      deviceId: dto.deviceId,
      type: dto.type,
      upload: { id: dto.uploadId } as Upload, // link without loading full entity ,  // ← Partial object, not full Upload
      status: 'pending', // UploadsService → call with uploadId, bservationsService → convert uploadId → upload relation
    });

    const saved = await this.observationsRepo.save(observation); // Saves to DB

    /* await */ this.processObservation(saved.id); //Remove 'await' (fire and forget)

    return saved; // Returns immediately (doesn't wait for AI)
  }

  private async updateResult(
    observation: Observation,
    aiRespone: BirdAiResponse,
  ): Promise<void> {
    try {
      observation.result = aiRespone; // Stores full AI response as JSON

      switch (aiRespone.status) {
        case 'identified': {
          // Ensure bird exist in DB
          const bird = await this.birdService.findOrCreate(
            aiRespone.result.scientificName,
          );

          observation.status = 'completed'; // pipeline completed
          observation.bird = bird; // Links to Bird entity
          break;
        }

        case 'uncertain': {
          observation.status = 'completed'; // pipeline completed, but AI uncertain
          observation.bird = null; // No bird linked
          break;
        }

        case 'failed': {
          observation.status = 'failed'; // pipeline failed
          observation.bird = null;
          break;
        }
      }

      await this.observationsRepo.save(observation);
    } catch (error) {
      observation.status = 'failed';
      observation.result = {
        status: 'failed',
        error: (error as Error).message,
      };
      await this.observationsRepo.save(observation);
    }
  }

  //AI processing for an observation
  private async processObservation(id: string) {
    // Loads the observation WITH the full upload data (including file_data buffer)
    //observation: Observation   --> id: string
    const observation = await this.observationsRepo.findOne({
      where: { id },
      relations: ['upload'], // ← Now loads full Upload entity
    });
    if (!observation) return;

    try {
      //Ask AI for scientific name
      const aiResponse = await this.aiService.process(
        observation.upload.file_data,
        observation.type,
      );

      await this.updateResult(observation, aiResponse); // Updates with AI results
    } catch (error) {
      observation.status = 'failed';
      await this.observationsRepo.save(observation);
    }
  }

  async findAll(): Promise<Observation[]> {
    return await this.observationsRepo.find();
  }

  async findOne(id: string): Promise<Observation> {
    const observation = await this.observationsRepo.findOneBy({ id });
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
    Object.assign(obs, partial, { updatedAt: new Date() });
    return this.observationsRepo.save(obs);
  }

  async remove(id: string): Promise<void> {
    const obs = await this.findOne(id);
    await this.observationsRepo.remove(obs);
  }
}
