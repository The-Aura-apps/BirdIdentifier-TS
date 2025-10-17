import { IsString, IsOptional, Length, IsUrl } from 'class-validator';

export class CreateFoodDto {
    @IsString()
    @Length(1, 255)
    name: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsString()
    @IsUrl()
    imageStorageKey?: string;
}
