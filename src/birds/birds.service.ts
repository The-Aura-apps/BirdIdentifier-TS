import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateBirdDto } from './dto/create-bird.dto';
import { Birds } from './entities/bird.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm'
import { UpdateBirdDto } from './dto/update-bird.dto';

@Injectable()
export class BirdsService {

  constructor(
    @InjectRepository(Birds)
    private readonly birdRepo: Repository<Birds>,
  ){}

  async create(createBirdDto: CreateBirdDto): Promise<Birds>{
    const bird = this.birdRepo.create(createBirdDto);
    return await this.birdRepo.save(createBirdDto);
  }

  async findOne(id: string): Promise<Birds>{
    const bird = await this.birdRepo.findOneBy({ id });
    if (!bird) {
        throw new NotFoundException(`bird ${id} not found`);
    } 
    return bird;
  }

  async findAll(): Promise<Birds[]>{
    return await this.birdRepo.find();
  }

  async update(id: string, updateBirdDto: UpdateBirdDto): Promise<Birds>{
    await this.birdRepo.update(id, updateBirdDto); 
    return this.findOne(id);
  }

  async remove(id: string): Promise<void>{
    const bird = await this.findOne(id);
    await this.birdRepo.remove(bird);
  }

  async findByScientificName(name: string): Promise<Birds | null>{
    return await this.birdRepo.findOne({ where: { scientificName: name} })
  }

 async findOrCreate(scientificName: string): Promise<Birds> {
  let bird = await this.birdRepo.findOneBy({ scientificName });

  if (!bird) {
    bird = this.birdRepo.create({
      id: crypto.randomUUID(),
      scientificName,
      commonName: 'Unknown (AI will fill later)',
      createAt: new Date(),
      updateAt: new Date(),
    });
    bird = await this.birdRepo.save(bird);
  }

  return bird;
  }

}
