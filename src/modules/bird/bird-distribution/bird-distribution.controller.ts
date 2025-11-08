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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import { BirdDistributionService } from './bird-distribution.service';
import { BirdDistribution } from './entities/bird-distribution.entity';
import { CreateBirdDistributionDto } from './dto/create-bird-distribution.dto';
import { UpdateBirdDistributionDto } from './dto/update-bird-distribution.dto';

@ApiTags('bird-distribution')
@Controller('bird-distribution')
export class BirdDistributionController {
    constructor(private readonly distributionService: BirdDistributionService) {}

    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Create bird distribution' })
    create(@Body() createDto: CreateBirdDistributionDto): Promise<BirdDistribution> {
        return this.distributionService.create(createDto);
    }

    @Get('bird/:birdId')
    @ApiOperation({ summary: 'Get all distributions for a bird' })
    @ApiParam({ name: 'birdId', description: 'Bird ID' })
    findByBirdId(@Param('birdId') birdId: string): Promise<BirdDistribution[]> {
        return this.distributionService.findByBirdId(+birdId);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get distribution by ID' })
    @ApiParam({ name: 'id', description: 'Distribution ID' })
    findOne(@Param('id') id: string): Promise<BirdDistribution> {
        return this.distributionService.findOne(+id);
    }

    @Put(':id')
    @ApiOperation({ summary: 'Update distribution' })
    @ApiParam({ name: 'id', description: 'Distribution ID' })
    update(
        @Param('id') id: string,
        @Body() updateDto: UpdateBirdDistributionDto,
    ): Promise<BirdDistribution> {
        return this.distributionService.update(+id, updateDto);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Delete distribution' })
    @ApiParam({ name: 'id', description: 'Distribution ID' })
    remove(@Param('id') id: string): Promise<void> {
        return this.distributionService.remove(+id);
    }
}
