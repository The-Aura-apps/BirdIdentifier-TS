import {
    Controller,
    Post,
    Body,
    Get,
    Param,
    NotFoundException,
    Patch,
    Delete,
    HttpCode,
    HttpStatus,
    ParseIntPipe,
    Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { ObservationsService } from './observations.service';
import { Observation } from './entities/observation.entity';
import { CreateObservationDto } from './dto/create-observation.dto';
import { UpdateObservationDto } from './dto/update-observation.dto';
import { Bird } from '@/modules/bird/birds/entities/bird.entity';

@ApiTags('observations')
@Controller('observations')
export class ObservationsController {
    constructor(private readonly observationsService: ObservationsService) {}

    @Post()
    create(@Body() dto: CreateObservationDto): Promise<Observation> {
        return this.observationsService.create(dto);
    }

    @Get()
    findAll(): Promise<Observation[]> {
        return this.observationsService.findAll();
    }

    @Get('history/:deviceId')
    getUserHistory(@Param('deviceId') deviceId: string): Promise<Bird[]> {
        return this.observationsService.findByDevice(deviceId);
    }

    @Get('history-simple/:deviceId')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Get simplified user bird search history',
        description: 'Returns bird ID, scientific name, and image URL for each observation. Only includes completed observations with bird data.',
    })
    @ApiParam({
        name: 'deviceId',
        description: 'Device/User ID',
        type: String,
        example: 'device-123-abc',
    })
    @ApiResponse({
        status: 200,
        description: 'Returns array with birdId, scientificName, and image',
        schema: {
            example: [
                {
                    birdId: 123,
                    scientificName: 'Turdus migratorius',
                    image: 'https://upload.wikimedia.org/wikipedia/commons/robin.jpg'
                }
            ]
        }
    })
    getSimplifiedHistory(@Param('deviceId') deviceId: string): Promise<any[]> {
        return this.observationsService.findSimplifiedHistory(deviceId);
    }

    @Get('history-unique/:deviceId')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Get unique user bird search history',
        description: 'Returns each unique bird only once, even if searched multiple times. Shows bird ID, scientific name, and image URL. Only includes completed observations with bird data.',
    })
    @ApiParam({
        name: 'deviceId',
        description: 'Device/User ID',
        type: String,
        example: '111a',
    })
    @ApiResponse({
        status: 200,
        description: 'Returns array with unique birds (birdId, scientificName, and image)',
        schema: {
            example: [
                {
                    birdId: 123,
                    scientificName: 'Turdus migratorius',
                    image: 'https://upload.wikimedia.org/wikipedia/commons/robin.jpg'
                },
                {
                    birdId: 456,
                    scientificName: 'Passer domesticus',
                    image: 'https://upload.wikimedia.org/wikipedia/commons/sparrow.jpg'
                }
            ]
        }
    })
    getUniqueUserHistory(@Param('deviceId') deviceId: string): Promise<any[]> {
        return this.observationsService.findUniqueUserHistory(deviceId);
    }

    

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.observationsService.findOne(id);
    }

    // @Get('device/:deviceId')
    // @ApiOperation({
    //     summary: 'Get observations by device (deprecated - use /history/:deviceId)',
    //     description: 'Returns all observations for a specific device. Use /history/:deviceId instead.',
    // })
    // @ApiParam({
    //     name: 'deviceId',
    //     description: 'Device ID',
    //     type: String,
    // })
    // findByDevice(
    //     @Param('deviceId')
    //     deviceId: string,
    // ): Promise<Observation[]> {
    //     return this.observationsService.findByDevice(deviceId);
    // }

    @Patch(':id')
    update(@Param('id') id: string, @Body() dto: UpdateObservationDto): Promise<Observation> {
        return this.observationsService.update(id, dto);
    }

    @Delete(':id')
    delete(@Param('id') id: string): Promise<void> {
        return this.observationsService.remove(id);
    }
}
