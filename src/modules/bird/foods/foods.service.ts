import {
    Injectable,
    NotFoundException,
    ConflictException,
    Logger,
    BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Food } from './entities/food.entity';
import { CreateFoodDto } from './dto/create-food.dto';
import { UpdateFoodDto } from './dto/update-food.dto';

@Injectable()
export class FoodService {
    private readonly logger = new Logger(FoodService.name);

    constructor(
        @InjectRepository(Food)
        private readonly foodRepo: Repository<Food>,
    ) {}

    async create(createDto: CreateFoodDto): Promise<Food> {
        // Check for duplicate name
        const existing = await this.foodRepo.findOne({
            where: { name: createDto.name },
        });

        if (existing) {
            throw new ConflictException(
                `Food with name "${createDto.name}" already exists`,
            );
        }

        const food = this.foodRepo.create(createDto);
        const saved = await this.foodRepo.save(food);

        this.logger.log(
            `Food created: ${saved.id} - ${saved.name}`,
        );
        return saved;
    }

    async findAll(
        options: { page?: number; limit?: number } = {},
    ): Promise<{ data: Food[]; total: number }> {
        const { page = 1, limit = 20 } = options;

        const [data, total] =
            await this.foodRepo.findAndCount({
                skip: (page - 1) * limit,
                take: limit,
                order: { name: 'ASC' },
            });

        return { data, total };
    }

    async findOne(id: number): Promise<Food> {
        const food = await this.foodRepo.findOne({
            where: { id },
            relations: ['birdFoods', 'birdFoods.bird'],
        });

        if (!food) {
            throw new NotFoundException(
                `Food with ID ${id} not found`,
            );
        }

        return food;
    }

    async findByName(name: string): Promise<Food> {
        const food = await this.foodRepo.findOne({
            where: { name },
            relations: ['birdFoods', 'birdFoods.bird'],
        });

        if (!food) {
            throw new NotFoundException(
                `Food with name "${name}" not found`,
            );
        }

        return food;
    }

    async update(
        id: number,
        updateDto: UpdateFoodDto,
    ): Promise<Food> {
        const food = await this.findOne(id);

        if (
            updateDto.name &&
            updateDto.name !== food.name
        ) {
            const existing = await this.foodRepo.findOne({
                where: { name: updateDto.name },
            });

            if (existing) {
                throw new ConflictException(
                    `Food with name "${updateDto.name}" already exists`,
                );
            }
        }

        Object.assign(food, updateDto);
        const updated = await this.foodRepo.save(food);

        this.logger.log(
            `Food updated: ${updated.id} - ${updated.name}`,
        );
        return updated;
    }

    async remove(id: number): Promise<void> {
        const food = await this.findOne(id);

        // Check if any birds are associated with this food
        const birdsCount = await this.foodRepo
            .createQueryBuilder('food')
            .innerJoin('food.birdFoods', 'birdFood')
            .where('food.id = :id', { id })
            .getCount();

        if (birdsCount > 0) {
            throw new ConflictException(
                `Cannot delete food ${id}: ${birdsCount} bird relationships exist`,
            );
        }

        await this.foodRepo.remove(food);
        this.logger.log(`Food deleted: ${id}`);
    }

    async getBirds(id: number) {
        const food = await this.foodRepo.findOne({
            where: { id },
            relations: [
                'birdFoods',
                'birdFoods.bird',
                'birdFoods.bird.conservationStatus',
            ],
        });

        if (!food) {
            throw new NotFoundException(
                `Food with ID ${id} not found`,
            );
        }

        // Only return active relationships
        const activeRelations = food.birdFoods.filter(
            (bf) => bf.isActive,
        );

        return {
            food: {
                id: food.id,
                name: food.name,
                description: food.description,
                imageStorageKey: food.imageStorageKey,
            },
            birdRelations: activeRelations.map((bf) => ({
                id: bf.id,
                isActive: bf.isActive,
                bird: bf.bird,
            })),
        };
    }

    async toggleActive(id: number): Promise<Food> {
        const food = await this.findOne(id);

        // If food has active bird relationships, we can't deactivate it
        const activeBirdRelations = await this.foodRepo
            .createQueryBuilder('food')
            .innerJoin('food.birdFoods', 'birdFood')
            .where('food.id = :id', { id })
            .andWhere('birdFood.isActive = :isActive', {
                isActive: true,
            })
            .getCount();

        if (activeBirdRelations > 0) {
            throw new BadRequestException(
                `Cannot deactivate food ${id}: ${activeBirdRelations} active bird relationships exist`,
            );
        }

        // In a real scenario, you might have an 'active' field on Food entity
        // For now, we'll just return the food as we don't have an active field
        this.logger.log(
            `Toggle active requested for food: ${id}`,
        );
        return food;
    }
}
