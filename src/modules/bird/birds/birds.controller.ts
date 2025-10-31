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
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiParam,
    ApiQuery,
} from '@nestjs/swagger';
import { BirdsService } from './birds.service';
import { Bird } from './entities/bird.entity';
import { CreateBirdDto } from './dto/create-bird.dto';
import { UpdateBirdDto } from './dto/update-bird.dto';
import { CreateBirdFoodDto } from '../bird-foods/dto/create-bird-food.dto';
import { UpdateBirdFoodDto } from '../bird-foods/dto/update-bird-food.dto';
import { CreateCommonNameDto } from '../common-names/dto/create-common-name.dto';

@ApiTags('birds')
@Controller('birds')
export class BirdsController {
    constructor(private readonly birdService: BirdsService) {}

    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Create a new bird' })
    @ApiResponse({
        status: 201,
        description: 'Bird successfully created',
        type: Bird,
    })
    @ApiResponse({ status: 400, description: 'Bad request' })
    @ApiResponse({ status: 409, description: 'Bird already exists' })
    create(@Body() dto: CreateBirdDto): Promise<Bird> {
        return this.birdService.create(dto);
    }

    @Get()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Get all birds with pagination' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiQuery({ name: 'sortBy', required: false, type: String })
    @ApiQuery({ name: 'order', required: false, enum: ['ASC', 'DESC'] })
    findAll(
        @Query('page') page = '1',
        @Query('limit') limit = '20',
        @Query('sortBy') sortBy = 'createdAt',
        @Query('order') order: 'ASC' | 'DESC' = 'DESC',
    ): Promise<{ data: Bird[]; total: number }> {
        return this.birdService.findAll({
            page: Number(page),
            limit: Number(limit),
            sortBy,
            order,
        });
    }

    @Get('search/:query')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Search birds by name' })
    @ApiParam({ name: 'query', description: 'Search query' })
    search(
        @Param('query') query: string,
        @Query('page') page = '1',
        @Query('limit') limit = '20',
    ): Promise<{ data: Bird[]; total: number }> {
        return this.birdService.search(query, {
            page: Number(page),
            limit: Number(limit),
        });
    }

    @Get('habitat/:habitatId')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Get birds by habitat' })
    @ApiParam({ name: 'habitatId', description: 'Habitat ID' })
    findByHabitat(
        @Param('habitatId') habitatId: string,
        @Query('page') page = '1',
        @Query('limit') limit = '20',
    ): Promise<{ data: Bird[]; total: number }> {
        return this.birdService.findByHabitat(+habitatId, {
            page: Number(page),
            limit: Number(limit),
        });
    }

    @Get('conservation-status/:statusId')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Get birds by conservation status' })
    @ApiParam({ name: 'statusId', description: 'Conservation status ID' })
    findByConservationStatus(
        @Param('statusId') statusId: string,
        @Query('page') page = '1',
        @Query('limit') limit = '20',
    ): Promise<{ data: Bird[]; total: number }> {
        return this.birdService.findByConservationStatus(+statusId, {
            page: Number(page),
            limit: Number(limit),
        });
    }

    @Get('scientific/:scientificName')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Find bird by scientific name' })
    @ApiParam({ name: 'scientificName', description: 'Scientific name' })
    findByScientificName(
        @Param('scientificName') scientificName: string,
    ): Promise<Bird | null> {
        return this.birdService.findByScientificName(scientificName);
    }

    @Get(':id')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Get bird by ID' })
    @ApiParam({ name: 'id', description: 'Bird ID' })
    findOne(@Param('id') id: string): Promise<Bird> {
        return this.birdService.findOne(id);
    }

    @Put(':id')
    @ApiOperation({ summary: 'Update bird' })
    @ApiParam({ name: 'id', description: 'Bird ID' })
    update(
        @Param('id') id: string,
        @Body() updateBirdDto: UpdateBirdDto,
    ): Promise<Bird> {
        return this.birdService.update(id, updateBirdDto);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Delete bird' })
    @ApiParam({ name: 'id', description: 'Bird ID' })
    delete(@Param('id') id: string): Promise<void> {
        return this.birdService.remove(id);
    }

    // Observation count
    @Get(':id/observation-count')
    @ApiOperation({ summary: 'Get observation count for a bird' })
    @ApiParam({ name: 'id', description: 'Bird ID' })
    getObservationCount(@Param('id') id: string): Promise<number> {
        return this.birdService.getObservationCount(id);
    }

    // Food relationships
    @Get(':id/foods')
    @ApiOperation({ summary: 'Get all foods for a bird' })
    @ApiParam({ name: 'id', description: 'Bird ID' })
    getFoods(@Param('id') id: string) {
        return this.birdService.getFoods(+id);
    }

    @Post(':id/foods')
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Add food to bird' })
    @ApiParam({ name: 'id', description: 'Bird ID' })
    addFood(
        @Param('id') id: string,
        @Body() createBirdFoodDto: CreateBirdFoodDto,
    ) {
        return this.birdService.addFood(+id, createBirdFoodDto);
    }

    @Put(':birdId/foods/:foodId')
    @ApiOperation({ summary: 'Update bird-food relationship' })
    @ApiParam({ name: 'birdId', description: 'Bird ID' })
    @ApiParam({ name: 'foodId', description: 'Food ID' })
    updateFood(
        @Param('birdId') birdId: string,
        @Param('foodId') foodId: string,
        @Body() updateBirdFoodDto: UpdateBirdFoodDto,
    ) {
        return this.birdService.updateFood(+birdId, +foodId, updateBirdFoodDto);
    }

    @Delete(':birdId/foods/:foodId')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Remove food from bird' })
    @ApiParam({ name: 'birdId', description: 'Bird ID' })
    @ApiParam({ name: 'foodId', description: 'Food ID' })
    removeFood(
        @Param('birdId') birdId: string,
        @Param('foodId') foodId: string,
    ) {
        return this.birdService.removeFood(+birdId, +foodId);
    }

    @Patch(':birdId/foods/:foodId/toggle-active')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Toggle food active status' })
    @ApiParam({ name: 'birdId', description: 'Bird ID' })
    @ApiParam({ name: 'foodId', description: 'Food ID' })
    toggleFoodActive(
        @Param('birdId') birdId: string,
        @Param('foodId') foodId: string,
    ) {
        return this.birdService.toggleFoodActive(+birdId, +foodId);
    }

    // Habitat relationships
    @Get(':id/habitats')
    @ApiOperation({ summary: 'Get all habitats for a bird' })
    @ApiParam({ name: 'id', description: 'Bird ID' })
    getHabitats(@Param('id') id: string) {
        return this.birdService.getHabitats(+id);
    }

    @Post(':id/habitats/:habitatId')
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Add habitat to bird' })
    @ApiParam({ name: 'id', description: 'Bird ID' })
    @ApiParam({ name: 'habitatId', description: 'Habitat ID' })
    addHabitat(@Param('id') id: string, @Param('habitatId') habitatId: string) {
        return this.birdService.addHabitat(+id, +habitatId);
    }

    @Delete(':id/habitats/:habitatId')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Remove habitat from bird' })
    @ApiParam({ name: 'id', description: 'Bird ID' })
    @ApiParam({ name: 'habitatId', description: 'Habitat ID' })
    removeHabitat(
        @Param('id') id: string,
        @Param('habitatId') habitatId: string,
    ) {
        return this.birdService.removeHabitat(+id, +habitatId);
    }

    // Common names
    @Get(':id/common-names')
    @ApiOperation({ summary: 'Get all common names for a bird' })
    @ApiParam({ name: 'id', description: 'Bird ID' })
    getCommonNames(@Param('id') id: string) {
        return this.birdService.getCommonNames(+id);
    }

    @Post(':id/common-names')
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Add common name to bird' })
    @ApiParam({ name: 'id', description: 'Bird ID' })
    addCommonName(
        @Param('id') id: string,
        @Body() createCommonNameDto: CreateCommonNameDto,
    ) {
        return this.birdService.addCommonName(+id, createCommonNameDto);
    }

    // Media
    @Get(':id/media')
    @ApiOperation({ summary: 'Get all media for a bird' })
    @ApiParam({ name: 'id', description: 'Bird ID' })
    getMedia(@Param('id') id: string) {
        return this.birdService.getMedia(+id);
    }

    // Taxonomy
    @Get(':id/taxonomy')
    @ApiOperation({ summary: 'Get taxonomy for a bird' })
    @ApiParam({ name: 'id', description: 'Bird ID' })
    getTaxonomy(@Param('id') id: string) {
        return this.birdService.getTaxonomy(+id);
    }

    // Distributions
    @Get(':id/distributions')
    @ApiOperation({ summary: 'Get distributions for a bird' })
    @ApiParam({ name: 'id', description: 'Bird ID' })
    getDistributions(@Param('id') id: string) {
        return this.birdService.getDistributions(+id);
    }
}
