// conservation-status/conservation-status.controller.ts
import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    ParseEnumPipe,
    HttpCode,
    HttpStatus,
    UseInterceptors,
    ClassSerializerInterceptor,
} from '@nestjs/common';

import { ConservationStatusService } from './conservation-status.service';
import {
    ConservationStatus,
    ConservationStatusCode,
} from './entities/conservation-status.entity';
import { CreateConservationStatusDto } from './dto/create-conservation-status.dto';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Conservation Status')
@Controller('conservation-status')
@UseInterceptors(ClassSerializerInterceptor)
export class ConservationStatusController {
    constructor(
        private readonly conservationStatusService: ConservationStatusService,
    ) {}

    @Post()
    @HttpCode(HttpStatus.CREATED)
    async create(
        @Body() createConservationStatusDto: CreateConservationStatusDto,
    ): Promise<ConservationStatus> {
        const result = await this.conservationStatusService.findOrCreate(
            createConservationStatusDto,
        );
        if (!result) {
            throw new Error('Failed to create conservation status');
        }
        return result;
    }

    @Get()
    @ApiOperation({
        summary: 'Get all conservation statuses (sorted by severity)',
    })
    @ApiResponse({
        status: 200,
        description: 'List of all conservation statuses',
        type: [ConservationStatus],
    })
    async findAll(): Promise<ConservationStatus[]> {
        return this.conservationStatusService.findAll();
    }

    @Get('code/:code')
    async findByCode(
        @Param('code', new ParseEnumPipe(ConservationStatusCode))
        code: ConservationStatusCode,
    ): Promise<ConservationStatus> {
        const status = await this.conservationStatusService.findByCode(code);
        if (!status) {
            throw new Error(
                `Conservation status with code "${code}" not found`,
            );
        }
        return status;
    }

    // @Post('seed')
    // @HttpCode(HttpStatus.CREATED)
    // async seedDefaultStatuses(): Promise<{ message: string }> {
    //     await this.conservationStatusService.seedDefaultStatuses();
    //     return { message: 'Default conservation statuses seeded successfully' };
    // }

    // @Get('codes')
    // getAvailableCodes(): {
    //     code: ConservationStatusCode;
    //     description: string;
    // }[] {
    //     return [
    //         { code: ConservationStatusCode.EX, description: 'Extinct' },
    //         {
    //             code: ConservationStatusCode.EW,
    //             description: 'Extinct in the Wild',
    //         },
    //         {
    //             code: ConservationStatusCode.CR,
    //             description: 'Critically Endangered',
    //         },
    //         { code: ConservationStatusCode.EN, description: 'Endangered' },
    //         { code: ConservationStatusCode.VU, description: 'Vulnerable' },
    //         { code: ConservationStatusCode.NT, description: 'Near Threatened' },
    //         { code: ConservationStatusCode.LC, description: 'Least Concern' },
    //         { code: ConservationStatusCode.DD, description: 'Data Deficient' },
    //         { code: ConservationStatusCode.NE, description: 'Not Evaluated' },
    //     ];
    // }
}
