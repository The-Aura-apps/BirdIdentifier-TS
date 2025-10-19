import { IsString, IsNotEmpty, IsOptional, Length } from 'class-validator';

export class CreateTaxonomyDto {
    @IsNotEmpty()
    birdId: number;

    @IsOptional()
    @IsString()
    @Length(1, 100)
    phylum?: string;

    @IsOptional()
    @IsString()
    @Length(1, 100)
    class?: string;

    @IsString()
    @IsNotEmpty()
    @Length(1, 100)
    order: string;

    @IsString()
    @IsNotEmpty()
    @Length(1, 100)
    family: string;

    @IsString()
    @IsNotEmpty()
    @Length(1, 100)
    genus: string;
}
