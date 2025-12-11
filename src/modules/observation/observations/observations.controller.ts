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
import { Bird } from '@/modules/bird/birds/entities/bird.entity';

@ApiTags('observations')
@Controller('observations')
export class ObservationsController {
    constructor(private readonly observationsService: ObservationsService) {}

    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({
        summary: 'Create a new bird observation',
        description: 'Creates a new observation and starts AI processing in the background',
    })
    @ApiResponse({
        status: 201,
        description: 'Observation created successfully',
    })
    create(
        @Body()
        dto: CreateObservationDto,
    ): Promise<Observation> {
        return this.observationsService.create(dto);
    }

    @Get()
    @ApiOperation({
        summary: 'Get all observations',
        description: 'Returns all observations in the system',
    })
    findAll(): Promise<Observation[]> {
        return this.observationsService.findAll();
    }

    @Get('history/:deviceId')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Get user bird search history',
        description: 'Returns all bird observations/searches for a specific user (identified by deviceId). Results are sorted by date (newest first).',
    })
    @ApiParam({
        name: 'deviceId',
        description: 'Device/User ID',
        type: String,
        example: 'device-123-abc',
    })
    @ApiResponse({
        status: 200,
        description: 'Returns array of observations with bird data',
    })
    getUserHistory(@Param('deviceId') deviceId: string): Promise<Bird[]> {
        return this.observationsService.findByDevice(deviceId);
    }

    @Get(':id')
    @ApiOperation({
        summary: 'Get observation by ID',
        description: 'Returns a single observation with full bird details',
    })
    @ApiParam({
        name: 'id',
        description: 'Observation ID (UUID)',
        type: String,
    })
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
    @ApiOperation({
        summary: 'Update observation',
        description: 'Update observation details',
    })
    @ApiParam({
        name: 'id',
        description: 'Observation ID',
    })
    update(
        @Param('id')
        id: string,
        @Body()
        partial: Partial<Observation>,
    ): Promise<Observation> {
        return this.observationsService.update(id, partial);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({
        summary: 'Delete observation',
        description: 'Delete an observation by ID',
    })
    @ApiParam({
        name: 'id',
        description: 'Observation ID',
    })
    delete(
        @Param('id')
        id: string,
    ): Promise<void> {
        return this.observationsService.remove(id);
    }
}
