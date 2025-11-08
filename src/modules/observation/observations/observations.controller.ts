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
} from '@nestjs/common';
import { ObservationsService } from './observations.service';
import { Observation } from './entities/observation.entity';
import { CreateObservationDto } from './dto/create-observation.dto';

@Controller('observations')
export class ObservationsController {
    constructor(private readonly observationsService: ObservationsService) {}

    @Post()
    @HttpCode(HttpStatus.CREATED)
    create(
        @Body()
        dto: CreateObservationDto,
    ): Promise<Observation> {
        return this.observationsService.create(dto);
    }

    @Get()
    findAll(): Promise<Observation[]> {
        return this.observationsService.findAll();
    }

    @Get(':id')
    findOne(
        @Param('id')
        id: string,
    ): Promise<Observation> {
        return this.observationsService.findOne(id);
    }

    @Get('device/:deviceId')
    findByDevice(
        @Param('deviceId')
        deviceId: string,
    ): Promise<Observation[]> {
        return this.observationsService.findByDevice(deviceId);
    }

    @Patch(':id')
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
    delete(
        @Param('id')
        id: string,
    ): Promise<void> {
        return this.observationsService.remove(id);
    }
}
