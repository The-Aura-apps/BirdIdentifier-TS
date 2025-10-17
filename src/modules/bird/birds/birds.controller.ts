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
    Patch,
} from '@nestjs/common';
import { BirdsService } from './birds.service';
import { Bird } from './entities/bird.entity';
import { CreateBirdDto } from './dto/create-bird.dto';
import { UpdateBirdDto } from './dto/update-bird.dto';
import { CreateBirdFoodDto } from '../bird-foods/dto/create-bird-food.dto';
import { UpdateBirdFoodDto } from '../bird-foods/dto/update-bird-food.dto';

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

    @Get('scientific/:scientificName')
    @HttpCode(HttpStatus.OK)
    findByScientificName(
        @Param('scientificName') scientificName: string,
    ): Promise<Bird | null> {
        return this.birdService.findByScientificName(scientificName);
    }

    @Put(':id')
    update(
        @Param('id') id: string,
        @Body() updateBirdDto: UpdateBirdDto,
    ): Promise<Bird> {
        return this.birdService.update(id, updateBirdDto);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    delete(@Param('id') id: string): Promise<void> {
        return this.birdService.remove(id);
    }

    //observation content
    @Get(':id/observation-count')
    getObservationCount(@Param('id') id: string): Promise<number> {
        return this.birdService.getObservationCount(id);
    }

    // Food relatonship

    @Get(':id/foods')
    getFoods(@Param('id') id: string) {
        return this.birdService.getFoods(+id);
    }

    @Post(':id/foods')
    @HttpCode(HttpStatus.CREATED)
    addFood(
        @Param('id') id: string,
        @Body() createBirdFoodDto: CreateBirdFoodDto,
    ) {
        return this.birdService.addFood(+id, createBirdFoodDto);
    }

    @Put(':birdId/foods/:foodId')
    updateFood(
        @Param('birdId') birdId: string,
        @Param('foodId') foodId: string,
        @Body() updateBirdFoodDto: UpdateBirdFoodDto,
    ) {
        return this.birdService.updateFood(
            +birdId,
            +foodId,
            updateBirdFoodDto,
        );
    }

    @Delete(':birdId/foods/:foodId')
    @HttpCode(HttpStatus.NO_CONTENT)
    removeFood(
        @Param('birdId') birdId: string,
        @Param('foodId') foodId: string,
    ) {
        return this.birdService.removeFood(+birdId, +foodId);
    }

    @Patch(':birdId/foods/:foodId/toggle-active')
    @HttpCode(HttpStatus.OK)
    toggleFoodActive(
        @Param('birdId') birdId: string,
        @Param('foodId') foodId: string,
    ) {
        return this.birdService.toggleFoodActive(+birdId, +foodId);
    }
}
