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
import { ConservationStatusService } from './conservation-status.service';
import { ConservationStatus, ConservationStatusCode } from './entities/conservation-status.entity';
import { CreateConservationStatusDto } from './dto/create-conservation-status.dto';
import { UpdateConservationStatusDto } from './dto/update-conservation-status.dto';

@Controller('conservation-status')
export class ConservationStatusController {
    constructor(
        private readonly conservationStatusService: ConservationStatusService,
    ) {}

    @Post()
    @HttpCode(HttpStatus.CREATED)
    create(
        @Body() createDto: CreateConservationStatusDto,
    ): Promise<ConservationStatus> {
        return this.conservationStatusService.create(createDto);
    }

    @Get()
    findAll(
        @Query('page') page = '1',
        @Query('limit') limit = '20',
    ): Promise<{ data: ConservationStatus[]; total: number }> {
        return this.conservationStatusService.findAll({
            page: Number(page),
            limit: Number(limit),
        });
    }

    @Get(':id')
    findOne(@Param('id') id: string): Promise<ConservationStatus> {
        return this.conservationStatusService.findOne(+id);
    }

    @Get('code/:code')
    findByCode(
        @Param('code') code: ConservationStatusCode,
    ): Promise<ConservationStatus> {
        return this.conservationStatusService.findByCode(code);
    }

    @Put(':id')
    update(
        @Param('id') id: string,
        @Body() updateDto: UpdateConservationStatusDto,
    ): Promise<ConservationStatus> {
        return this.conservationStatusService.update(+id, updateDto);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    remove(@Param('id') id: string): Promise<void> {
        return this.conservationStatusService.remove(+id);
    }
}
