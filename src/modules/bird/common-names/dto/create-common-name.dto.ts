import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';

export class CreateCommonNameDto {
    @IsNumber()
    @IsNotEmpty()
    birdId: number;

    @IsString()
    @IsNotEmpty()
    name: string;

    @IsOptional()
    @IsString()
    language?: string;
}
