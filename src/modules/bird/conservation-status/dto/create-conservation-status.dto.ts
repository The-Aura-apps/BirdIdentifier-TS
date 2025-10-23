import { IsString, IsOptional, Length, Matches } from 'class-validator';

export class CreateConservationStatusDto {
    @IsString()
    @Length(2, 5)
    code: string; // LC, NT, VU, EN, CR

    @IsString()
    @Length(1, 100)
    fullName: string;

    @IsOptional()
    @IsString()
    @Length(7, 7)
    @Matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
    colorHex?: string;
}

// import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
// import { ApiProperty } from '@nestjs/swagger';

// export class CreateConservationStatusDto {
//     @ApiProperty({
//         description: 'Conservation status code',
//         example: 'LC',
//     })
//     @IsString()
//     @IsNotEmpty()
//     code: string;

//     @ApiProperty({
//         description: 'Authority that determined the status',
//         example: 'OpenAI Generated',
//     })
//     @IsString()
//     @IsNotEmpty()
//     authority: string;

//     @ApiProperty({
//         description: 'Description of conservation status and threats',
//         example:
//             'Threats: habitat loss, climate change. Conservation efforts: protected areas',
//         required: false,
//     })
//     @IsString()
//     @IsOptional()
//     description?: string;
// }