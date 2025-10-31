// import { Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
// import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
// import { DataCollectorService } from './data-collector.service';
// import { DataProcessorService } from '../data-processor/data-processor.service';

// @ApiTags('Data Collection')
// @Controller('data-collector')
// export class DataCollectorController {
//     constructor(
//         private readonly collectorService: DataCollectorService,
//         private readonly processorService: DataProcessorService,
//     ) {}

//     @Post('collect/:scientificName')
//     @HttpCode(HttpStatus.OK)
//     @ApiOperation({ summary: 'Collect bird data from external APIs' })
//     @ApiResponse({ status: 200, description: 'Data collected successfully' })
//     @ApiResponse({ status: 400, description: 'Invalid scientific name' })
//     async collectBirdData() {}
// }
