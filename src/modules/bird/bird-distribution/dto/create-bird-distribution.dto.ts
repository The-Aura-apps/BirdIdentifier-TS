import {
    IsString,
    IsNotEmpty,
    IsOptional,
    IsNumber,
    IsArray,
    IsEnum,
} from 'class-validator';
import { DistributionSeason } from '../entities/bird-distribution.entity';

export class CreateBirdDistributionDto {
    @IsNumber()
    @IsNotEmpty()
    birdId: number;

    @IsEnum(DistributionSeason)
    @IsNotEmpty()
    season: DistributionSeason;

    @IsOptional()
    @IsArray()
    countries?: string[];

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    rangeGeoJson?: any;
}
