import { Injectable, NotFoundException } from '@nestjs/common';
import { Observation } from './entities/observation.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { BirdsService } from 'src/birds/birds.service';
import { AiService } from 'src/ai/ai.service';
import { CreateObservationDto } from './dto/create-observation.dto';
import { Upload } from 'src/uploads/entities/upload.entity';

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
    const observation = this.observationsRepo.create({
      deviceId: dto.deviceId,
      type: dto.type,
      upload: { id: dto.uploadId } as Upload,  // link without loading full entity ,
      status: 'pending',                       // UploadsService → call with uploadId, bservationsService → convert uploadId → upload relation
    });

  const saved = await this.observationsRepo.save(observation);

  this.processObservation(saved.id);
  
  return saved;
  }

  //AI processing for an observation   
  private async processObservation(id: string){   //observation: Observation   --> id: string
    const observation = await this.observationsRepo.findOne({
      where: { id },
      relations: ['upload'],
    });
    if (!observation) return;

    try {

        //Ask AI for scientific name
      const scientificName = await this.aiService.identifyBird(
        observation.upload.fileData,
        observation.type,
      );

      //Ensure bird exists in DB
      const bird = await  this.birdService.findOrCreate(scientificName);
            
      //Update Observation with result
      observation.status = 'completed';
      observation.result = scientificName;
      observation.bird = bird; 
      await this.observationsRepo.save(observation);
    } catch(error){
      observation.status = 'failed';
      await this.observationsRepo.save(observation);
    }
  }

  async findAll(): Promise<Observation[]>{
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
