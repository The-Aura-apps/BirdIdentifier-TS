// dto/create-media.dto.ts
import {
  IsInt,
  IsOptional,
  IsString,
  IsEnum,
  IsObject,
  ValidateNested,
  Length,
  IsNumber,
} from "class-validator";
import { Type } from "class-transformer";

enum MediaType {
  Photo = "photo",
  Audio = "audio",
  Video = "video",
}

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
  birdId: number; // Required for association

  @IsString()
  @Length(1, 500)
  storageKey: string;

  @IsEnum(MediaType)
  type: MediaType = MediaType.Photo; // Default matches entity

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
  @IsInt()
  orderIndex?: number = 0; // Default matches entity

  @IsOptional()
  @ValidateNested()
  @Type(() => MetadataDto)
  @IsObject()
  metadata?: MetadataDto;
}
