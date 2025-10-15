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

    @IsOptional()
    @IsObject()
    features?: {
        sizeAndShape?: string;
        colorPattern?: string;
        billShape?: string;
        markings?: string;
    };

    @IsOptional()
    @IsObject()
    ecology?: {
        habitat?: string;
        behavior?: string;
        diet?: string;
    };

    @IsOptional()
    @IsObject()
    geography?: {
        rangeMap?: string;
        yearRound?: string;
        breeding?: string;
        wintering?: string;
        migration?: string;
        seasonality?: string;
    };

    @IsOptional()
    @IsObject()
    education?: {
        conservation?: string;
        nesting?: string;
        eggs?: string;
        coolFacts?: string[];
    };
}
