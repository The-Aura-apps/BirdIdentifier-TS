import { ApiProperty } from '@nestjs/swagger';

/**
 * Mobile-friendly bird summary with essential info at top level
 */
export class BirdSummaryDto {
    @ApiProperty({ description: 'Bird ID', example: 123 })
    id: number;

    @ApiProperty({ description: 'Scientific name', example: 'Turdus migratorius' })
    scientificName: string;

    @ApiProperty({
        description: 'Primary common name (English)',
        example: 'American Robin',
    })
    primaryCommonName: string;

    @ApiProperty({
        description: 'URL of primary/thumbnail image',
        example: 'https://cdn.example.com/birds/robin-thumb.jpg',
        nullable: true,
    })
    thumbnailUrl: string | null;

    @ApiProperty({
        description: 'Short description (first 200 chars)',
        example: 'A familiar songbird with a red-orange breast...',
        nullable: true,
    })
    shortDescription: string | null;

    @ApiProperty({
        description: 'Conservation status code',
        example: 'LC',
        nullable: true,
    })
    conservationCode: string | null;

    @ApiProperty({
        description: 'Conservation status full name',
        example: 'Least Concern',
        nullable: true,
    })
    conservationStatus: string | null;

    @ApiProperty({
        description: 'Bird family',
        example: 'Turdidae',
        nullable: true,
    })
    family: string | null;

    @ApiProperty({
        description: 'Average size in cm (length)',
        example: 25,
        nullable: true,
    })
    averageSizeCm: number | null;

    @ApiProperty({
        description: 'Number of observations recorded',
        example: 42,
    })
    observationCount: number;

    @ApiProperty({
        description: 'Number of media items (photos/audio)',
        example: 5,
    })
    mediaCount: number;
}
