// create-bird.dto.ts
import { IsString, IsNotEmpty, IsOptional, IsObject } from 'class-validator';

export class CreateBirdDto {
  @IsOptional()
  @IsString()
  commonName?: string;

  @IsNotEmpty()
  @IsString()
  scientificName: string;

  @IsOptional()
  @IsObject()
  photos?: {
    male?: string;
    female?: string;
  };
}
