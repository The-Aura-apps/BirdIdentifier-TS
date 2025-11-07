import {
    IsInt,
    IsOptional,
    IsNumber,
    IsString,
    IsArray,
    IsObject,
    ValidateNested,
    Min,
    Max,
    IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { DistributionSeason } from '../entities/bird-distribution.entity';

class CoordinatesDto {
    @IsNumber()
    lat: number;

    @IsNumber()
    lng: number;
}

class LocationDto {
    @IsOptional()
    @IsString()
    country?: string;

    @IsOptional()
    @IsString()
    region?: string;

    @IsOptional()
    @ValidateNested()
    @Type(() => CoordinatesDto)
    coordinates?: CoordinatesDto;
}

export class CreateBirdDistributionDto {
    @IsInt()
    birdId: number; // For association

    @IsInt()
    @Min(1)
    @Max(12)
    month: number; // Required, as per entity

    @IsEnum(DistributionSeason)
    season: DistributionSeason; // Added to match the enum and index in entity (assuming entity needs fix)

    @IsOptional()
    @ValidateNested()
    @Type(() => LocationDto)
    location?: LocationDto;

    @IsOptional()
    @IsNumber()
    @Min(0)
    @Max(1)
    presenceScore?: number;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    countries?: string[];
}
