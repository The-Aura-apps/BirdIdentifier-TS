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
    ParseIntPipe,
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
import { AdminApiKeyGuard } from 'src/core/guards/admin-api-key.guard';

@ApiTags('birds')
@Controller('birds')
@UseGuards(AdminApiKeyGuard)
export class BirdsController {
    constructor(private readonly birdService: BirdsService) {}

    @Post()
    create(@Body() dto: CreateBirdDto): Promise<Bird> {
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
        description: 'Fast in-memory search through 11,145 bird species from Clements Checklist. Returns up to 20 matching suggestions for autocomplete.',
    })
    @ApiQuery({
        name: 'q',
        required: true,
        type: String,
        description: 'Search query (common name or scientific name)',
        example: 'robin',
    })
    @ApiResponse({
        status: 200,
        description: 'Returns array of matching birds with scientific and English names',
        schema: {
            example: [
                {
                    scientificName: 'Turdus migratorius',
                    englishName: 'American Robin',
                },
                {
                    scientificName: 'Erithacus rubecula',
                    englishName: 'European Robin',
                },
                {
                    scientificName: 'Petroica longipes',
                    englishName: 'North Island Robin',
                },
            ],
        },
    })
    @ApiResponse({
        status: 400,
        description: 'Missing or invalid query parameter',
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
        summary: 'Fetch full bird data by scientific name',
        description:
            'Validates scientific name exists in Clements catalog (11,145 species), then returns complete bird data from database. If bird not in database, fetches details via OpenAI including description, diet, taxonomy, images, and audio.',
    })
    @ApiParam({
        name: 'scientificName',
        required: true,
        type: String,
        description: 'Scientific name of the bird (must exist in Clements catalog)',
        example: 'Turdus migratorius',
    })
    @ApiResponse({
        status: 200,
        description: 'Returns complete bird data with taxonomy, habitat, media, and distribution',
        schema: {
            example: {
                id: 123,
                scientificName: 'Turdus migratorius',
                englishName: 'American Robin',
                description: 'A medium-sized songbird with gray-brown upperparts, rusty-orange breast, and white throat with dark streaks.',
                diet: 'Omnivore - earthworms, insects, berries',
                wingspan: '12-16 inches',
                length: '9-11 inches',
                weight: '77g',
                image: 'https://upload.wikimedia.org/wikipedia/commons/robin.jpg',
                audioUrl: 'https://xeno-canto.org/sounds/robin.mp3',
                createdAt: '2025-12-16T10:30:00.000Z',
                updatedAt: '2025-12-16T10:30:00.000Z',
                taxonomy: {
                    kingdom: 'Animalia',
                    phylum: 'Chordata',
                    class: 'Aves',
                    order: 'Passeriformes',
                    family: 'Turdidae',
                    genus: 'Turdus',
                    species: 'migratorius',
                },
                habitat: [
                    {
                        id: 1,
                        name: 'Forest',
                        description: 'Woodland and forest areas',
                    },
                    {
                        id: 3,
                        name: 'Urban',
                        description: 'Parks, gardens, lawns',
                    },
                ],
                conservationStatus: {
                    code: 'LC',
                    description: 'Least Concern',
                },
                media: [],
                distributions: [],
            },
        },
    })
    @ApiResponse({
        status: 404,
        description: 'Scientific name not found in Clements catalog',
        schema: {
            example: {
                statusCode: 404,
                message: 'Scientific name "Invalid Name" not found in bird catalog',
                error: 'Not Found',
            },
        },
    })
    async searchCatalogAndFetch(@Param('scientificName') scientificName: string): Promise<Bird> {
        return this.birdService.searchCatalogAndFetchBird(scientificName);
    }

    @Get('scientific/:scientificName')
    async getBirdByScientificName(@Param('scientificName') scientificName: string): Promise<Bird> {
        return this.birdService.findOrCreate(scientificName);
    }


    @Get()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Get all birds with pagination',
        description: 'Returns paginated list of all birds in database with full details including taxonomy, habitat, and media.',
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
    @ApiQuery({
        name: 'sortBy',
        required: false,
        type: String,
        description: 'Field to sort by',
        example: 'createdAt',
    })
    @ApiQuery({
        name: 'order',
        required: false,
        enum: ['ASC', 'DESC'],
        description: 'Sort order',
        example: 'DESC',
    })
    @ApiResponse({
        status: 200,
        description: 'Returns paginated bird list with total count',
        schema: {
            example: {
                data: [
                    {
                        id: 123,
                        scientificName: 'Turdus migratorius',
                        englishName: 'American Robin',
                        description: 'A medium-sized songbird...',
                        diet: 'Omnivore',
                        wingspan: '12-16 inches',
                        length: '9-11 inches',
                        weight: '77g',
                        image: 'https://upload.wikimedia.org/wikipedia/commons/robin.jpg',
                        audioUrl: 'https://xeno-canto.org/sounds/robin.mp3',
                        createdAt: '2025-12-16T10:30:00.000Z',
                    },
                ],
                total: 245,
            },
        },
    })
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
    search(@Param('query') query: string, @Query('page') page = '1', @Query('limit') limit = '20'): Promise<{ data: Bird[]; total: number }> {
        return this.birdService.search(query, {
            page: Number(page),
            limit: Number(limit),
        });
    }

    // Habitat filtering and search endpoints - MUST be before :id route
    @Get('filter-by-habitat')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Filter birds by habitat with optional name search',
        description:
            'Filters birds by habitat ID, then optionally searches within results by bird name (common or scientific). Returns paginated results with habitat info.',
    })
    @ApiQuery({
        name: 'habitatId',
        required: true,
        type: Number,
        description: 'Habitat ID to filter by',
        example: 5,
    })
    @ApiQuery({
        name: 'search',
        required: false,
        type: String,
        description: 'Optional: Bird name to search for (common or scientific name)',
        example: 'sparrow',
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
        example: 10,
    })
    @ApiResponse({
        status: 200,
        description: 'Returns paginated birds with habitat name',
        schema: {
            example: {
                data: [
                    {
                        id: 45,
                        scientificName: 'Passer domesticus',
                        englishName: 'House Sparrow',
                        description: 'Small, chunky bird...',
                        diet: 'Omnivore - seeds, insects',
                        wingspan: '8-10 inches',
                        length: '6 inches',
                        weight: '27g',
                        image: 'https://upload.wikimedia.org/wikipedia/commons/sparrow.jpg',
                    },
                ],
                total: 15,
                habitat: 'Urban',
            },
        },
    })
    @ApiResponse({
        status: 404,
        description: 'Habitat not found',
    })
    filterByHabitatAndSearch(
        @Query('habitatId', ParseIntPipe) habitatId: number,
        @Query('search') search: string,
        @Query('page') page = '1',
        @Query('limit') limit = '20',
    ): Promise<{
        data: Bird[];
        total: number;
        habitat: string;
    }> {
        return this.birdService.filterByHabitatAndSearch(habitatId, search, {
            page: Number(page),
            limit: Number(limit),
        });
    }

    @Get('search-by-habitat')
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
    getBirdsByHabitat(@Param('habitatId', ParseIntPipe) habitatId: number): Promise<Bird[]> {
        return this.birdService.getBirdsByHabitat(habitatId);
    }

    @Get('by-habitat-simple/:habitatId')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Get simplified birds by habitat ID',
        description:
            'Returns bird ID, scientific name, and image URL for all birds in the specified habitat',
    })
    @ApiParam({
        name: 'habitatId',
        description: 'Habitat ID',
        type: Number,
        example: 2,
    })
    @ApiResponse({
        status: 200,
        description: 'Returns array with birdId, scientificName, and image',
        schema: {
            example: [
                {
                    birdId: 123,
                    scientificName: 'Turdus migratorius',
                    image: 'https://upload.wikimedia.org/wikipedia/commons/robin.jpg',
                },
            ],
        },
    })
    @ApiResponse({
        status: 404,
        description: 'Habitat not found',
    })
    getSimplifiedBirdsByHabitat(@Param('habitatId', ParseIntPipe) habitatId: number): Promise<any[]> {
        return this.birdService.getSimplifiedBirdsByHabitat(habitatId);
    }

    @Get('scientific/:scientificName')
    findByScientificName(
        @Param('scientificName')
        scientificName: string,
    ): Promise<Bird | null> {
        return this.birdService.findByScientificName(scientificName);
    }

    @Get(':id')
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
    delete(
        @Param('id')
        id: string,
    ): Promise<void> {
        return this.birdService.remove(id);
    }



    // Observation count
    @Get(':id/observation-count')
    getObservationCount(@Param('id') id: string): Promise<number> {
        return this.birdService.getObservationCount(id);
    }

    // Food relationships
    @Get(':id/foods')
    getFoods(@Param('id', ParseIntPipe) id: number) {
        return this.birdService.getFoods(id);
    }

    @Post(':id/foods')
    addFood(@Param('id', ParseIntPipe) id: number, @Body() createBirdFoodDto: CreateBirdFoodDto) {
        return this.birdService.addFood(id, createBirdFoodDto);
    }

    @Put(':birdId/foods/:foodId')
    updateFood(
        @Param('birdId', ParseIntPipe) birdId: number,
        @Param('foodId', ParseIntPipe) foodId: number,
        @Body() updateBirdFoodDto: UpdateBirdFoodDto,
    ) {
        return this.birdService.updateFood(birdId, foodId, updateBirdFoodDto);
    }

    @Delete(':birdId/foods/:foodId')
    removeFood(@Param('birdId', ParseIntPipe) birdId: number, @Param('foodId', ParseIntPipe) foodId: number) {
        return this.birdService.removeFood(birdId, foodId);
    }

    @Patch(':birdId/foods/:foodId/toggle-active')
    toggleFoodActive(@Param('birdId', ParseIntPipe) birdId: number, @Param('foodId', ParseIntPipe) foodId: number) {
        return this.birdService.toggleFoodActive(birdId, foodId);
    }

    // Habitat relationships
    @Get('habitat/:habitatId')
    findByHabitat(@Param('habitatId', ParseIntPipe) habitatId: number, @Query('page') page = '1', @Query('limit') limit = '20'): Promise<{ data: Bird[]; total: number }> {
        return this.birdService.findByHabitat(habitatId, {
            page: Number(page),
            limit: Number(limit),
        });
    }

    @Get(':id/habitats')
    getHabitats(@Param('id', ParseIntPipe) id: number) {
        return this.birdService.getHabitats(id);
    }

    @Post(':id/habitats/:habitatId')
    addHabitat(@Param('id', ParseIntPipe) id: number, @Param('habitatId', ParseIntPipe) habitatId: number) {
        return this.birdService.addHabitat(id, habitatId);
    }

    @Delete(':id/habitats/:habitatId')
    removeHabitat(@Param('id', ParseIntPipe) id: number, @Param('habitatId', ParseIntPipe) habitatId: number) {
        return this.birdService.removeHabitat(id, habitatId);
    }

    // Common names
    @Get(':id/commonNames')
    getCommonNames(@Param('id', ParseIntPipe) id: number) {
        return this.birdService.getCommonNames(id);
    }

    @Post(':id/commonNames')
    addCommonName(@Param('id', ParseIntPipe) id: number, @Body() createCommonNameDto: CreateCommonNameDto) {
        return this.birdService.addCommonName(id, createCommonNameDto);
    }

    // Media
    @Get(':id/media')
    getMedia(@Param('id', ParseIntPipe) id: number) {
        return this.birdService.getMedia(id);
    }

    @Post(':id/media')
    addMedia(@Param('id', ParseIntPipe) id: number, @Body() createDto: CreateMediaDto) {
        return this.birdService.addMedia(id, createDto);
    }

    // Taxonomy
    @Get(':id/taxonomy')
    getTaxonomy(@Param('id', ParseIntPipe) id: number) {
        return this.birdService.getTaxonomy(id);
    }

    // Conservation Status
    @Get(':id/conservationStatus')
    getConservationStatus(@Param('id', ParseIntPipe) id: number) {
        return this.birdService.getConservationStatus(id);
    }

    // Distributions
    @Get(':id/distributions')
    getDistributions(@Param('id', ParseIntPipe) id: number) {
        return this.birdService.getDistributions(id);
    }

    @Post(':id/distributions')
    addDistribution(@Param('id', ParseIntPipe) id: number, @Body() createDto: CreateBirdDistributionDto) {
        return this.birdService.addDistribution(id, createDto);
    }
}
