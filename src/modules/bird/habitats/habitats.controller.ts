import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Put,
    Delete,
    HttpCode,
    HttpStatus,
    Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam } from '@nestjs/swagger';
import { Habitat } from './entities/habitat.entity';
import { CreateHabitatDto } from './dto/create-habitat.dto';
import { UpdateHabitatDto } from './dto/update-habitat.dto';
import { HabitatService } from './habitats.service';

@ApiTags('Habitats')
@Controller('habitats')
export class HabitatController {
    constructor(private readonly habitatService: HabitatService) {}

    @Post()
    create(@Body() createDto: CreateHabitatDto): Promise<Habitat> {
        return this.habitatService.create(createDto);
    }

    @Get()
    @ApiOperation({
        summary: 'Get all habitats with pagination',
        description: 'Returns paginated list of all bird habitats (Forest, Wetland, Urban, etc.).',
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
        description: 'Returns paginated habitat list with total count',
        schema: {
            example: {
                data: [
                    {
                        id: 1,
                        name: 'Forest',
                        description: 'Woodland and forest areas',
                        isActive: true,
                        createdAt: '2025-12-16T10:30:00.000Z',
                    },
                    {
                        id: 2,
                        name: 'Wetland',
                        description: 'Marshes, swamps, and wetland areas',
                        isActive: true,
                        createdAt: '2025-12-16T10:30:00.000Z',
                    },
                ],
                total: 12,
            },
        },
    })
    findAll(
        @Query('page')
        page = '1',
        @Query('limit')
        limit = '20',
    ): Promise<{
        data: Habitat[];
        total: number;
    }> {
        return this.habitatService.findAll({
            page: Number(page),
            limit: Number(limit),
        });
    }

    @Get(':id')
    findOne(@Param('id') id: string): Promise<Habitat> {
        return this.habitatService.findOne(+id);
    }

    @Get('name/:name')
    findByName(@Param('name') name: string): Promise<Habitat> {
        return this.habitatService.findByName(name);
    }

    @Put(':id')
    update(@Param('id') id: string, @Body() updateDto: UpdateHabitatDto): Promise<Habitat> {
        return this.habitatService.update(+id, updateDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string): Promise<void> {
        return this.habitatService.remove(+id);
    }

    @Get(':id/birds')
    getBirds(@Param('id') id: string) {
        return this.habitatService.getBirds(+id);
    }
}
