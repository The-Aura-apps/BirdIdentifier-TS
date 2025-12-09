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
    UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { BirdsService } from './birds.service';
import { Bird } from './entities/bird.entity';
import { CreateBirdDto } from './dto/create-bird.dto';
import { UpdateBirdDto } from './dto/update-bird.dto';
import { CreateBirdFoodDto } from '../bird-foods/dto/create-bird-food.dto';
import { UpdateBirdFoodDto } from '../bird-foods/dto/update-bird-food.dto';
import { CreateCommonNameDto } from '../common-names/dto/create-common-name.dto';

import { CreateBirdDistributionDto } from '../bird-distribution/dto/create-bird-distribution.dto';
import { CreateMediaDto } from 'src/modules/media/dto/create-media.dto';

@ApiTags('birds')
@Controller('birds')
export class BirdsController {
    constructor(private readonly birdService: BirdsService) {}

    @Post()
    @HttpCode(HttpStatus.CREATED)
    create(
        @Body()
        dto: CreateBirdDto,
    ): Promise<Bird> {
        return this.birdService.create(dto);
    }

    /**
     * Search bird catalog (typeahead/autocomplete)
     * GET /birds/catalog/search?q=robin
     */
    @Get('catalog/search')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Search bird catalog for typeahead/autocomplete',
        description: 'Fast search through Clements catalog. Returns up to 20 suggestions.',
    })
    @ApiQuery({
        name: 'q',
        required: true,
        type: String,
        description: 'Search query (common name or scientific name)',
    })
    searchCatalog(@Query('q') query: string): { scientificName: string; englishName: string }[] {
        return this.birdService.searchCatalog(query);
    }

    /**
     * Search catalog and fetch full bird data
     * GET /birds/catalog/fetch/:scientificName
     */
    @Get('catalog/fetch/:scientificName')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Fetch full bird data from catalog search',
        description: 'Validates scientific name exists in Clements catalog, then returns full bird data from database or fetches via AI if not exists.',
    })
    @ApiParam({
        name: 'scientificName',
        required: true,
        type: String,
        description: 'Scientific name of the bird (must exist in catalog)',
    })
    async searchCatalogAndFetch(@Param('scientificName') scientificName: string): Promise<Bird> {
        return this.birdService.searchCatalogAndFetchBird(scientificName);
    }

    @Get('scientific/:scientificName')
    @HttpCode(HttpStatus.OK)
    async getBirdByScientificName(@Param('scientificName') scientificName: string): Promise<Bird> {
        return this.birdService.findOrCreate(scientificName);
    }

    @Get()
    @HttpCode(HttpStatus.OK)
    findAll(
        @Query('page')
        page = '1',
        @Query('limit')
        limit = '20',
        @Query('sortBy')
        sortBy = 'createdAt',
        @Query('order')
        order: 'ASC' | 'DESC' = 'DESC',
    ): Promise<{
        data: Bird[];
        total: number;
    }> {
        return this.birdService.findAll({
            page: Number(page),
            limit: Number(limit),
            sortBy,
            order,
        });
    }

    @Get('search/:query')
    @HttpCode(HttpStatus.OK)
    search(
        @Param('query')
        query: string,
        @Query('page')
        page = '1',
        @Query('limit')
        limit = '20',
    ): Promise<{
        data: Bird[];
        total: number;
    }> {
        return this.birdService.search(query, {
            page: Number(page),
            limit: Number(limit),
        });
    }

    // Habitat filtering and search endpoints - MUST be before :id route
    @Get('filter-by-habitat')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Filter birds by habitat and search by bird name',
        description: 'First filters birds by specific habitat ID, then searches within those birds by their common or scientific name. Returns paginated results.',
    })
    @ApiQuery({
        name: 'habitatId',
        required: true,
        type: Number,
        description: 'Habitat ID to filter by',
        example: 1,
    })
    @ApiQuery({
        name: 'search',
        required: false,
        type: String,
        description: 'Bird name to search for (common name or scientific name)',
        example: 'robin',
    })
    @ApiQuery({
        name: 'page',
        required: false,
        type: Number,
        description: 'Page number',
        example: 1,
    })
    @ApiQuery({
        name: 'limit',
        required: false,
        type: Number,
        description: 'Items per page',
        example: 20,
    })
    @ApiResponse({
        status: 200,
        description: 'Returns paginated list of birds filtered by habitat and searched by name',
    })
    filterByHabitatAndSearch(
        @Query('habitatId') habitatId: string,
        @Query('search') search: string,
        @Query('page') page = '1',
        @Query('limit') limit = '20',
    ): Promise<{
        data: Bird[];
        total: number;
        habitat: string;
    }> {
        return this.birdService.filterByHabitatAndSearch(+habitatId, search, {
            page: Number(page),
            limit: Number(limit),
        });
    }

    @Get('search-by-habitat')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Search birds by habitat name',
        description: 'Search for birds by habitat name (partial match). Returns paginated results.',
    })
    @ApiQuery({
        name: 'name',
        required: true,
        type: String,
        description: 'Habitat name to search for (partial match)',
        example: 'forest',
    })
    @ApiQuery({
        name: 'page',
        required: false,
        type: Number,
        description: 'Page number',
        example: 1,
    })
    @ApiQuery({
        name: 'limit',
        required: false,
        type: Number,
        description: 'Items per page',
        example: 20,
    })
    @ApiResponse({
        status: 200,
        description: 'Returns paginated list of birds matching the habitat search',
    })
    searchBirdsByHabitat(
        @Query('name') name: string,
        @Query('page') page = '1',
        @Query('limit') limit = '20',
    ): Promise<{
        data: Bird[];
        total: number;
        habitat: string;
    }> {
        return this.birdService.searchBirdsByHabitatName(name, {
            page: Number(page),
            limit: Number(limit),
        });
    }

    @Get('by-habitat/:habitatId')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Filter birds by specific habitat ID',
        description: 'Returns all birds that live in the specified habitat',
    })
    @ApiParam({
        name: 'habitatId',
        description: 'Habitat ID',
        type: Number,
    })
    @ApiResponse({
        status: 200,
        description: 'Returns array of birds living in the habitat',
    })
    @ApiResponse({
        status: 404,
        description: 'Habitat not found',
    })
    getBirdsByHabitat(@Param('habitatId') habitatId: string): Promise<Bird[]> {
        return this.birdService.getBirdsByHabitat(+habitatId);
    }

    @Get('scientific/:scientificName')
    @HttpCode(HttpStatus.OK)
    findByScientificName(
        @Param('scientificName')
        scientificName: string,
    ): Promise<Bird | null> {
        return this.birdService.findByScientificName(scientificName);
    }

    @Get(':id')
    @HttpCode(HttpStatus.OK)
    findOne(
        @Param('id')
        id: string,
    ): Promise<Bird> {
        return this.birdService.findOne(id);
    }

    @Put(':id')
    update(
        @Param('id')
        id: string,
        @Body()
        updateBirdDto: UpdateBirdDto,
    ): Promise<Bird> {
        return this.birdService.update(id, updateBirdDto);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    delete(
        @Param('id')
        id: string,
    ): Promise<void> {
        return this.birdService.remove(id);
    }

    // Observation count
    @Get(':id/observation-count')
    @ApiOperation({
        summary: 'Get observation count for a bird',
    })
    @ApiParam({
        name: 'id',
        description: 'Bird ID',
    })
    getObservationCount(
        @Param('id')
        id: string,
    ): Promise<number> {
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
    addFood(@Param('id') id: string, @Body() createBirdFoodDto: CreateBirdFoodDto) {
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
    removeFood(@Param('birdId') birdId: string, @Param('foodId') foodId: string) {
        return this.birdService.removeFood(+birdId, +foodId);
    }

    @Patch(':birdId/foods/:foodId/toggle-active')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Toggle food active status for bird' })
    @ApiParam({ name: 'birdId', description: 'Bird ID' })
    @ApiParam({ name: 'foodId', description: 'Food ID' })
    toggleFoodActive(@Param('birdId') birdId: string, @Param('foodId') foodId: string) {
        return this.birdService.toggleFoodActive(+birdId, +foodId);
    }

    // Habitat relationships
    @Get('habitat/:habitatId')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Get birds by habitat (deprecated - use /by-habitat/:habitatId)',
    })
    @ApiParam({
        name: 'habitatId',
        description: 'Habitat ID',
    })
    findByHabitat(
        @Param('habitatId')
        habitatId: string,
        @Query('page')
        page = '1',
        @Query('limit')
        limit = '20',
    ): Promise<{
        data: Bird[];
        total: number;
    }> {
        return this.birdService.findByHabitat(+habitatId, {
            page: Number(page),
            limit: Number(limit),
        });
    }

    @Get(':id/habitats')
    @ApiOperation({
        summary: 'Get all habitats for a bird',
    })
    @ApiParam({
        name: 'id',
        description: 'Bird ID',
    })
    getHabitats(
        @Param('id')
        id: string,
    ) {
        return this.birdService.getHabitats(+id);
    }

    @Post(':id/habitats/:habitatId')
    @HttpCode(HttpStatus.CREATED)
    addHabitat(
        @Param('id')
        id: string,
        @Param('habitatId')
        habitatId: string,
    ) {
        return this.birdService.addHabitat(+id, +habitatId);
    }

    @Delete(':id/habitats/:habitatId')
    @HttpCode(HttpStatus.NO_CONTENT)
    removeHabitat(
        @Param('id')
        id: string,
        @Param('habitatId')
        habitatId: string,
    ) {
        return this.birdService.removeHabitat(+id, +habitatId);
    }

    // Common names
    @Get(':id/commonNames')
    @ApiOperation({
        summary: 'Get all common names for a bird',
    })
    @ApiParam({
        name: 'id',
        description: 'Bird ID',
    })
    getCommonNames(
        @Param('id')
        id: string,
    ) {
        return this.birdService.getCommonNames(+id);
    }

    @Post(':id/commonNames')
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({
        summary: 'Add common name to bird',
    })
    @ApiParam({
        name: 'id',
        description: 'Bird ID',
    })
    addCommonName(
        @Param('id')
        id: string,
        @Body()
        createCommonNameDto: CreateCommonNameDto,
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

    @Post(':id/media')
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Add media to bird' })
    @ApiParam({ name: 'id', description: 'Bird ID' })
    addMedia(@Param('id') id: string, @Body() createDto: CreateMediaDto) {
        return this.birdService.addMedia(+id, createDto);
    }

    // Taxonomy
    @Get(':id/taxonomy')
    @ApiOperation({
        summary: 'Get taxonomy for a bird',
    })
    @ApiParam({
        name: 'id',
        description: 'Bird ID',
    })
    getTaxonomy(
        @Param('id')
        id: string,
    ) {
        return this.birdService.getTaxonomy(+id);
    }

    // Conservation Status
    @Get(':id/conservationStatus')
    @ApiOperation({
        summary: 'Get conservation status for a bird',
    })
    @ApiParam({
        name: 'id',
        description: 'Bird ID',
    })
    @ApiResponse({
        status: 200,
        description: 'Returns the conservation status of the bird',
    })
    @ApiResponse({
        status: 404,
        description: 'Bird not found',
    })
    getConservationStatus(
        @Param('id')
        id: string,
    ) {
        return this.birdService.getConservationStatus(+id);
    }

    // Distributions
    @Get(':id/distributions')
    @ApiOperation({ summary: 'Get all distributions for a bird' })
    @ApiParam({ name: 'id', description: 'Bird ID' })
    getDistributions(@Param('id') id: string) {
        return this.birdService.getDistributions(+id);
    }

    @Post(':id/distributions')
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Add distribution to bird' })
    @ApiParam({ name: 'id', description: 'Bird ID' })
    addDistribution(@Param('id') id: string, @Body() createDto: CreateBirdDistributionDto) {
        return this.birdService.addDistribution(+id, createDto);
    }
}
