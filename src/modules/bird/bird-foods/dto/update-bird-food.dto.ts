import { PartialType } from '@nestjs/mapped-types';
import { CreateBirdFoodDto } from './create-bird-food.dto';

export class UpdateBirdFoodDto extends PartialType(CreateBirdFoodDto) {}
