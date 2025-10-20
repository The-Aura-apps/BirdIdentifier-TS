import { IsString, IsNotEmpty, IsOptional, Length } from 'class-validator';

export class CreateHabitatDto {
    @IsString()
    @IsNotEmpty()
    @Length(1, 100)
    name: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsString()
    iconUrl?: string;
}
