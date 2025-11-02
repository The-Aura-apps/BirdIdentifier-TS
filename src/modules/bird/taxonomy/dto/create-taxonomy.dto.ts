import { IsString, IsOptional, IsNotEmpty, Length } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTaxonomyDto {
    @ApiPropertyOptional({
        description: 'Phylum name (default: Chordata)',
        example: 'Chordata',
        maxLength: 100,
    })
    @IsOptional()
    @IsString()
    @Length(1, 100)
    phylum?: string;

    @ApiPropertyOptional({
        description: 'Class name (default: Aves)',
        example: 'Aves',
        maxLength: 100,
    })
    @IsOptional()
    @IsString()
    @Length(1, 100)
    class?: string;

    @ApiProperty({
        description: 'Order name (required)',
        example: 'Passeriformes',
        maxLength: 100,
    })
    @IsString()
    @IsNotEmpty()
    @Length(1, 100)
    order: string;

    @ApiProperty({
        description: 'Family name (required)',
        example: 'Corvidae',
        maxLength: 100,
    })
    @IsString()
    @IsNotEmpty()
    @Length(1, 100)
    family: string;

    @ApiProperty({
        description: 'Genus name (required)',
        example: 'Corvus',
        maxLength: 100,
    })
    @IsString()
    @IsNotEmpty()
    @Length(1, 100)
    genus: string;
}
