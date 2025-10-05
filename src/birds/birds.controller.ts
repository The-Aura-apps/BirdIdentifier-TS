import {
  Body,
  Controller,
  Param,
  Post,
  Get,
  Put,
  Delete,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CreateBirdDto } from './dto/create-bird.dto';
import { BirdsService } from './birds.service';
import { UpdateBirdDto } from './dto/update-bird.dto';
import { Bird } from './entities/bird.entity';

@Controller('birds')
export class BirdsController {
  constructor(private readonly birdServise: BirdsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateBirdDto): Promise<Bird> {
    return this.birdServise.create(dto);
  }

  @Get()
  findAll() {
    return this.birdServise.findAll();
  }

  @Get(':id/observation-count')
  getObservationCountent(@Param('id') id: string): Promise<number> {
    return this.birdServise.getObservationCount(id);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() updateBirdDto: UpdateBirdDto,
  ): Promise<Bird> {
    return this.birdServise.update(id, updateBirdDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleat(@Param('id') id: string) {
    return this.birdServise.remove(id);
  }
}
