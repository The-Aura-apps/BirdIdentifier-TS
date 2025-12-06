import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ArrayMinSize, ArrayMaxSize, IsString } from 'class-validator';

export class BatchFetchBirdsDto {
    @ApiProperty({
        description: 'Array of scientific names to fetch',
        example: ['Turdus migratorius', 'Erithacus rubecula', 'Passer domesticus'],
        type: [String],
        minItems: 1,
        maxItems: 10,
    })
    @IsArray()
    @ArrayMinSize(1)
    @ArrayMaxSize(10)
    @IsString({ each: true })
    scientificNames: string[];
}

export class BatchFetchResultDto {
    @ApiProperty({ description: 'Scientific name requested' })
    scientificName: string;

    @ApiProperty({ description: 'Whether the bird was found/created successfully' })
    success: boolean;

    @ApiProperty({ description: 'Error message if failed', nullable: true })
    error: string | null;

    @ApiProperty({ description: 'Full bird data if successful', nullable: true })
    bird: any | null;
}
