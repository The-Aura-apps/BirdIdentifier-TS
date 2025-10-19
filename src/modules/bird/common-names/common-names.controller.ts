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
import { CommonNamesService } from './common-names.service';
import { CommonName } from './entities/common-name.entity';
import { CreateCommonNameDto } from './dto/create-common-name.dto';
import { UpdateCommonNameDto } from './dto/update-common-name.dto';

@Controller('common-names')
export class CommonNamesController {
    constructor(private readonly commonNamesService: CommonNamesService) {}

    @Post()
    @HttpCode(HttpStatus.CREATED)
    create(@Body() createDto: CreateCommonNameDto): Promise<CommonName> {
        return this.commonNamesService.create(createDto);
    }

    @Get('bird/:birdId')
    findByBirdId(@Param('birdId') birdId: string): Promise<CommonName[]> {
        return this.commonNamesService.findByBirdId(+birdId);
    }

    @Get(':id')
    findOne(@Param('id') id: string): Promise<CommonName> {
        return this.commonNamesService.findOne(+id);
    }

    @Put(':id')
    update(
        @Param('id') id: string,
        @Body() updateDto: UpdateCommonNameDto,
    ): Promise<CommonName> {
        return this.commonNamesService.update(+id, updateDto);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    remove(@Param('id') id: string): Promise<void> {
        return this.commonNamesService.remove(+id);
    }
}
