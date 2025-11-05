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
import { Habitat } from './entities/habitat.entity';
import { CreateHabitatDto } from './dto/create-habitat.dto';
import { UpdateHabitatDto } from './dto/update-habitat.dto';
import { HabitatService } from './habitats.service';

@Controller('habitats')
export class HabitatController {
    constructor(private readonly habitatService: HabitatService) {}

    @Post()
    @HttpCode(HttpStatus.CREATED)
    create(
        @Body()
        createDto: CreateHabitatDto
    ): Promise<Habitat> {
        return this.habitatService.create(createDto);
    }

    @Get()
    findAll(
        @Query('page')
        page = '1',
        @Query('limit')
        limit = '20'
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
    findOne(
        @Param('id')
        id: string
    ): Promise<Habitat> {
        return this.habitatService.findOne(+id);
    }

    @Get('name/:name')
    findByName(
        @Param('name')
        name: string
    ): Promise<Habitat> {
        return this.habitatService.findByName(name);
    }

    @Put(':id')
    update(
        @Param('id')
        id: string,
        @Body()
        updateDto: UpdateHabitatDto
    ): Promise<Habitat> {
        return this.habitatService.update(+id, updateDto);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    remove(
        @Param('id')
        id: string
    ): Promise<void> {
        return this.habitatService.remove(+id);
    }

    @Get(':id/birds')
    getBirds(
        @Param('id')
        id: string
    ) {
        return this.habitatService.getBirds(+id);
    }
}
