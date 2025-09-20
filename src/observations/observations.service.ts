import { Injectable, NotFoundException } from '@nestjs/common';
import { Observation } from './entities/observation.entity';
import { CreateObservationDto } from './dto/create-observation.dto';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { BirdsService } from 'src/birds/birds.service';
import { Birds } from 'src/birds/entities/bird.entity';
import { AiService } from 'src/ai/ai.service';

@Injectable()
export class ObservationsService {
  constructor(
    @InjectRepository(Observation)
    private readonly observationsRepo: Repository<Observation>,
    private readonly aiService: AiService,
    private readonly birdService: BirdsService,
  ) {}


  // Create Observation from API input (client)
  async create(dto: CreateObservationDto ): Promise<Observation>{
    let observation = this.observationsRepo.create({
      ...dto,    
      status: 'pending',
      createdAt: new Date(), 
      updatedAt: new Date()
    });

  observation = await this.observationsRepo.save(observation);

  this.processObservation(observation);
    return observation;
  }


  //Internal method for UploadsService
  async createObservation(data: Partial<Observation>): Promise<Observation> {
    const observation = this.observationsRepo.create({
      ...data,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const saved = await this.observationsRepo.save(observation);

    // Trigger AI for processing
    this.processObservation(saved);

    return saved;
  }

  //AI processing for an observation
  private async processObservation(observation: Observation){
    try {
        //Ask AI for scientific name
      const scientificName = await this.aiService.identifyBird(
        observation.fileUrl,
        observation.type,
      );

      //Ensure bird exists in DB
      const bird = await  this.birdService.findByScientificName(scientificName);
            
      //Update Observation with result
      observation.status = 'completed';
      observation.result = scientificName;
      (observation as any).birdId = bird?.id;
      observation.updatedAt = new Date();
      await this.observationsRepo.save(observation);
      
    } catch(error){
        observation.status = 'failed';
        observation.updatedAt = new Date();
        await this.observationsRepo.save(observation)
    }
  }

  async findAll(): Promise<Observation[]>{      // [\]
    return await this.observationsRepo.find();
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
    Object.assign(obs, partial, { updatedAt: new Date() });
    return this.observationsRepo.save(obs);
  }

  async remove(id: string): Promise<void>{
    const obs = await this.findOne(id);
    await this.observationsRepo.remove(obs)
  }

}
