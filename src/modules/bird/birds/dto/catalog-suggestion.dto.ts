import { ApiProperty } from '@nestjs/swagger';

export class CatalogSuggestionDto {
    @ApiProperty({
        description: 'Scientific name of the bird',
        example: 'Turdus migratorius',
    })
    scientificName: string;

    @ApiProperty({
        description: 'English common name',
        example: 'American Robin',
    })
    englishName: string;

    @ApiProperty({
        description: 'Whether this bird already exists in the database',
        example: true,
    })
    isInDatabase: boolean;

    @ApiProperty({
        description: 'Estimated time in seconds to fetch if not in database (null if already in DB)',
        example: null,
        nullable: true,
    })
    estimatedFetchTimeSeconds: number | null;
}
