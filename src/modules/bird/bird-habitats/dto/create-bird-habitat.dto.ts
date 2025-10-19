import { IsNumber } from 'class-validator';

export class CreateBirdHabitatDto {
    @IsNumber()
    birdId: number;

    @IsNumber()
    habitatId: number;
}
