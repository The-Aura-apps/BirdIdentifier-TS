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
import { BirdDistributionService } from './bird-distribution.service';
import { BirdDistribution } from './entities/bird-distribution.entity';
import { CreateBirdDistributionDto } from './dto/create-bird-distribution.dto';
import { UpdateBirdDistributionDto } from './dto/update-bird-distribution.dto';

@Controller('bird-distribution')
export class BirdDistributionController {
    constructor(
        private readonly distributionService: BirdDistributionService,
    ) {}

    @Post()
    @HttpCode(HttpStatus.CREATED)
    create(
        @Body() createDto: CreateBirdDistributionDto,
    ): Promise<BirdDistribution> {
        return this.distributionService.create(createDto);
    }

    @Get('bird/:birdId')
    findByBirdId(
        @Param('birdId') birdId: string,
    ): Promise<BirdDistribution[]> {
        return this.distributionService.findByBirdId(
            +birdId,
        );
    }

    @Get(':id')
    findOne(
        @Param('id') id: string,
    ): Promise<BirdDistribution> {
        return this.distributionService.findOne(+id);
    }

    @Put(':id')
    update(
        @Param('id') id: string,
        @Body() updateDto: UpdateBirdDistributionDto,
    ): Promise<BirdDistribution> {
        return this.distributionService.update(
            +id,
            updateDto,
        );
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    remove(@Param('id') id: string): Promise<void> {
        return this.distributionService.remove(+id);
    }
}
