import {
    IsString,
    IsNotEmpty,
    IsOptional,
    IsNumber,
    IsArray,
} from 'class-validator';

export class CreateBirdDistributionDto {
    @IsNumber()
    @IsNotEmpty()
    birdId: number;

    @IsString()
    @IsNotEmpty()
    season: string;

    @IsOptional()
    @IsArray()
    countries?: string[];

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    rangeGeoJson?: any;
}
