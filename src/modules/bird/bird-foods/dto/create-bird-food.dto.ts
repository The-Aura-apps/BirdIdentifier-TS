// dto/create-bird-food.dto.ts
import { IsNumber, IsBoolean, IsOptional } from "class-validator";

export class CreateBirdFoodDto {
  @IsNumber()
  birdId: number; // Added for clarity, assuming creation might be standalone or need explicit bird

  @IsNumber()
  foodId: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean = false; // Default matches entity
}
