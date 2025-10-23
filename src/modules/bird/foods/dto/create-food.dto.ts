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

// import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
// import { ApiProperty } from '@nestjs/swagger';

// export class CreateFoodDto {
//     @ApiProperty({
//         description: 'Type of food',
//         example: 'seeds',
//     })
//     @IsString()
//     @IsNotEmpty()
//     type: string;

//     @ApiProperty({
//         description: 'Description of the food item',
//         example: 'Part of natural diet',
//     })
//     @IsString()
//     @IsNotEmpty()
//     description: string;

//     @ApiProperty({
//         description: 'Season when this food is consumed',
//         example: 'year-round',
//         required: false,
//     })
//     @IsString()
//     @IsOptional()
//     season?: string;
// }