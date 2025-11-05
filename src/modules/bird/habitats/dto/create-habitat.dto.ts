import { IsString, IsNotEmpty, IsOptional, Length } from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';

// export class CreateHabitatDto {
//     @ApiProperty({
//         description: 'Type of habitat',
//         example: 'forest',
//     })
//     @IsString()
//     @IsNotEmpty()
//     type: string;

//     @ApiProperty({
//         description: 'Description of the habitat',
//         example: 'Primary habitat: tropical rainforest',
//     })
//     @IsString()
//     @IsNotEmpty()
//     description: string;

//     @ApiProperty({
//         description: 'Regions where this habitat is found',
//         example: 'South America, Central America',
//         required: false,
//     })
//     @IsString()
//     @IsOptional()
//     regions?: string;
// }

export class CreateHabitatDto {
    @IsString()
    @IsNotEmpty()
    @Length(1, 100)
    name: string;

    @IsOptional()
    @IsString()
    description?: string;

    // @IsOptional()
    // @IsString()
    // iconUrl?: string;
}
