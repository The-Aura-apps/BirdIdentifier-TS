// dto/create-food.dto.ts
import { IsString, IsOptional, Length } from "class-validator";

export class CreateFoodDto {
  @IsString()
  @Length(1, 255)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  @Length(0, 500)
  imageStorageKey?: string; // Added to match entity, made optional
}
