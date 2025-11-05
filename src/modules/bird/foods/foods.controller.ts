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
import { FoodService } from './foods.service';
import { Food } from './entities/food.entity';
import { CreateFoodDto } from './dto/create-food.dto';
import { UpdateFoodDto } from './dto/update-food.dto';

@Controller('foods')
export class FoodController {
    constructor(private readonly foodService: FoodService) {}

    @Post()
    @HttpCode(HttpStatus.CREATED)
    create(
        @Body()
        createDto: CreateFoodDto
    ): Promise<Food> {
        return this.foodService.create(createDto);
    }

    @Get()
    findAll(
        @Query('page')
        page = '1',
        @Query('limit')
        limit = '20'
    ): Promise<{
        data: Food[];
        total: number;
    }> {
        return this.foodService.findAll({
            page: Number(page),
            limit: Number(limit),
        });
    }

    @Get(':id')
    findOne(
        @Param('id')
        id: string
    ): Promise<Food> {
        return this.foodService.findOne(+id);
    }

    @Get('name/:name')
    findByName(
        @Param('name')
        name: string
    ): Promise<Food> {
        return this.foodService.findByName(name);
    }

    @Put(':id')
    update(
        @Param('id')
        id: string,
        @Body()
        updateDto: UpdateFoodDto
    ): Promise<Food> {
        return this.foodService.update(+id, updateDto);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    remove(
        @Param('id')
        id: string
    ): Promise<void> {
        return this.foodService.remove(+id);
    }

    @Get(':id/birds')
    getBirds(
        @Param('id')
        id: string
    ) {
        return this.foodService.getBirds(+id);
    }

    @Post(':id/toggle-active')
    @HttpCode(HttpStatus.OK)
    toggleActive(
        @Param('id')
        id: string
    ) {
        return this.foodService.toggleActive(+id);
    }
}
