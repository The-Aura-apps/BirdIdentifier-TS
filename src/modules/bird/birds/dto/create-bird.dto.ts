import {
    IsString,
    IsNotEmpty,
    IsOptional,
    IsObject,
    IsArray,
} from 'class-validator';
import { CreateCommonNameDto } from '../../common-names/dto/create-common-name.dto';

export class CreateBirdDto {
    @IsNotEmpty()
    @IsString()
    scientificName: string;

    @IsOptional()
    @IsArray()
    commonNames?: CreateCommonNameDto[];

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
    lifeExpectancyYears?: number;

    @IsOptional()
    conservationStatusId?: number;
}
