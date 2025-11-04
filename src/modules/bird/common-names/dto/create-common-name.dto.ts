import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

// Use this for standalone creation via API
export class CreateCommonNameDto {
    @IsNotEmpty()
    birdId: number;

    @IsString()
    @IsNotEmpty()
    name: string;

    @IsOptional()
    @IsString()
    language?: string;

    @IsOptional()
    @IsString()
    region?: string;
}

export class CreateCommonNameNestedDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsOptional()
    @IsString()
    language?: string;

    @IsOptional()
    @IsString()
    region?: string;
}