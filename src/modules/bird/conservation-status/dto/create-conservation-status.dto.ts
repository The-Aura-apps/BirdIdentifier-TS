import { IsString, IsOptional, Length, Matches, IsEnum } from 'class-validator';
import { ConservationStatusCode } from '../entities/conservation-status.entity';

export class CreateConservationStatusDto {
    @IsEnum(ConservationStatusCode)
    @Length(2, 5)
    code: ConservationStatusCode;

    @IsString()
    @Length(1, 100)
    fullName: string;
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