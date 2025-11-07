import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateBirdFoodDto {
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

}