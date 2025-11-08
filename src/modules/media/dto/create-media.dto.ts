import {
    IsInt,
    IsOptional,
    IsString,
    IsEnum,
    IsObject,
    ValidateNested,
    Length,
    IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';
import { MediaType } from '../entities/media.entity';

class MetadataDto {
    @IsOptional()
    @IsNumber()
    width?: number;

    @IsOptional()
    @IsNumber()
    height?: number;

    @IsOptional()
    @IsNumber()
    duration?: number;

    @IsOptional()
    @IsNumber()
    fileSize?: number;

    @IsOptional()
    @IsString()
    mimeType?: string;

    @IsOptional()
    @IsString()
    format?: string;

    @IsOptional()
    @IsNumber()
    bitrate?: number;

    @IsOptional()
    @IsNumber()
    sampleRate?: number;

    @IsOptional()
    @IsString()
    thumbnailKey?: string;
}

export class CreateMediaDto {
    @IsInt()
    birdId: number; 

    @IsString()
    @Length(1, 500)
    storageKey: string;

    @IsEnum(MediaType)
    type: MediaType;

    @IsOptional()
    @IsString()
    size?: string;

    @IsOptional()
    @IsString()
    @Length(0, 255)
    caption?: string;

    @IsOptional()
    @IsString()
    @Length(0, 255)
    source?: string;

    @IsOptional()
    @IsString()
    @Length(0, 255)
    attribution?: string;

    @IsOptional()
    @IsNumber()
    orderIndex?: number;

    @IsOptional()
    @ValidateNested()
    @Type(() => MetadataDto)
    metadata?: MetadataDto;
}
