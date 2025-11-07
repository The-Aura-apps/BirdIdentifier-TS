// dto/create-bird-food.dto.ts
import { IsNumber, IsBoolean, IsOptional, IsString } from "class-validator";

export class CreateBirdFoodDto {
  @IsNumber()
  birdId: number; 

  @IsNumber()
  foodId: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean = false; // Default matches entity
}

// dto/create-bird-food-nested.dto.ts
export class CreateBirdFoodNestedDto {
    @IsNumber()
    foodId: number; // Only foodId needed, no birdId

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

    @IsOptional()
    @IsString()
    notes?: string;
}