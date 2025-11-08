import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsString, IsNumber, IsOptional, Min, Max, Length } from 'class-validator';
import { ConservationStatusCode } from '../entities/conservation-status.entity';

export class CreateConservationStatusDto {
    @ApiProperty({
        enum: ConservationStatusCode,
        description: 'IUCN conservation status code',
        example: 'LC',
    })
    @IsEnum(ConservationStatusCode)
    code: ConservationStatusCode;

    @ApiProperty({
        description: 'Full name of conservation status',
        example: 'Least Concern',
        maxLength: 100,
    })
    @IsString()
    @Length(1, 100)
    fullName: string;

    @ApiPropertyOptional({
        description: 'Description of what this status means',
    })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiProperty({
        description: 'Severity ranking (higher = more threatened) 0 to 9',
        example: 0,
        minimum: 0,
        maximum: 9,
    })
    @IsNumber()
    @Min(0)
    @Max(9)
    severityLevel: number;

    @ApiProperty({
        description: 'Authority that defined this status',
        example: 'IUCN',
        maxLength: 50,
        default: 'IUCN',
    })
    @IsString()
    @Length(1, 50)
    @IsOptional()
    authority?: string;
}
