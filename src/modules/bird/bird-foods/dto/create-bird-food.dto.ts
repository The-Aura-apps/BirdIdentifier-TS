import {
    IsNumber,
    IsBoolean,
    IsOptional,
} from 'class-validator';

export class CreateBirdFoodDto {
    @IsNumber()
    foodId: number;

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}
