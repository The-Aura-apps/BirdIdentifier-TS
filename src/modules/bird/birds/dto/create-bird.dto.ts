import {
    IsString,
    IsNotEmpty,
    IsOptional,
    IsObject,
    IsArray,
    IsNumber,
    ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateCommonNameDto } from '../../common-names/dto/create-common-name.dto';

export class CreateBirdDto {
    @IsNotEmpty()
    @IsString()
    scientificName: string;

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateCommonNameDto)
    commonNames?: CreateCommonNameDto[];

    @IsOptional()
    @IsArray()
    @IsNumber({}, { each: true })
    habitatIds?: number[]; // Add habitat IDs

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsString()
    behavior?: string;

    @IsOptional()
    @IsString()
    nestingHabits?: string;

    @IsOptional()
    @IsString()
    feedingHabits?: string;

    @IsOptional()
    @IsString()
    eggsDescription?: string;

    @IsOptional()
    @IsString()
    coolFacts?: string;

    @IsOptional()
    @IsObject()
    size?: {
        lengthCm: { min: number; max: number };
        wingspanCm: { min: number; max: number };
        weightGrams: { min: number; max: number };
    };

    @IsOptional()
    @IsNumber()
    lifeExpectancyYears?: number;

    @IsOptional()
    @IsNumber()
    conservationStatusId?: number;
}
