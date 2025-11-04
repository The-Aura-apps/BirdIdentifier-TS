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
import {
    CreateCommonNameDto,
    CreateCommonNameNestedDto,
} from '../../common-names/dto/create-common-name.dto';
import { CreateTaxonomyDto } from '../../taxonomy/dto/create-taxonomy.dto';
import { CreateConservationStatusDto } from '../../conservation-status/dto/create-conservation-status.dto';

export class CreateBirdDto {
    @IsNotEmpty()
    @IsString()
    scientificName: string;

    @IsOptional()
    @ValidateNested()
    @Type(() => CreateTaxonomyDto)
    taxonomy?: CreateTaxonomyDto;

    @IsOptional()
    @ValidateNested()
    @Type(() => CreateConservationStatusDto)
    conservationStatus?: CreateConservationStatusDto;

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateCommonNameNestedDto)
    commonNames?: CreateCommonNameNestedDto[];

    @IsOptional()
    @IsArray()
    @IsNumber({}, { each: true })
    habitatIds?: number[];

    @IsOptional() @IsString() description?: string;
    @IsOptional() @IsString() behavior?: string;
    @IsOptional() @IsString() nestingHabits?: string;
    @IsOptional() @IsString() feedingHabits?: string;
    @IsOptional() @IsString() eggsDescription?: string;
    @IsOptional() @IsString() coolFacts?: string;

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
}
