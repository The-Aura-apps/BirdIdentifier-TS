import { Body, Controller, Param, Post, Get, Put, Delete } from '@nestjs/common';
import { CreateBirdDto } from './dto/create-bird.dto';
import { BirdsService } from './birds.service';
import { UpdateBirdDto } from './dto/update-bird.dto';

@Controller('birds')
export class BirdsController {
  
  constructor( private readonly birdServise: BirdsService ){}
  @Post()
  create(@Body() bdto: CreateBirdDto){
    return this.birdServise.create(bdto);
  }

  @Get(':id')
  findOne(@Param('id') id: string){
    return this.birdServise.findOne(id);
  }
  
  @Get()
  findAll(){
    return this.birdServise.findAll();
  }

  @Put(':id')
  update(@Param('id') id: string,@Body() updateBirdDto: UpdateBirdDto){
    return this.birdServise.update(id, updateBirdDto);
  }

  @Delete(':id')
  deleat(@Param('id')id: string){
    return this.birdServise.remove(id);
  }
}
