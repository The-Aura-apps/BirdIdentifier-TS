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
    Query,
} from '@nestjs/common';
import { CreateBirdDto } from './dto/create-bird.dto';
import { BirdsService } from './birds.service';
import { UpdateBirdDto } from './dto/update-bird.dto';
import { Bird } from './entities/bird.entity';

@Controller('birds')
export class BirdsController {
    constructor(private readonly birdService: BirdsService) {}

    @Post()
    @HttpCode(HttpStatus.CREATED)
    create(@Body() dto: CreateBirdDto): Promise<Bird> {
        return this.birdService.create(dto);
    }

    @Get()
    @HttpCode(HttpStatus.OK)
    findAll(
        @Query('page') page = '1',
        @Query('limit') limit = '20',
        @Query('sortBy') sortBy = 'createdAt',
        @Query('order') order: 'ASC' | 'DESC' = 'DESC',
    ): Promise<Bird[]> {
        return this.birdService.findAll({
            page: Number(page),
            limit: Number(limit),
            sortBy,
            order,
        });
    }

    @Get(':id')
    @HttpCode(HttpStatus.OK)
    findOne(@Param('id') id: string): Promise<Bird> {
        return this.birdService.findOne(id);
    }

    @Get(':id/observation-count')
    getObservationCount(@Param('id') id: string): Promise<number> {
        return this.birdService.getObservationCount(id);
    }

    @Put(':id')
    update(@Param('id') id: string, @Body() updateBirdDto: UpdateBirdDto): Promise<Bird> {
        return this.birdService.update(id, updateBirdDto);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    delete(@Param('id') id: string): Promise<void> {
        return this.birdService.remove(id);
    }
}
