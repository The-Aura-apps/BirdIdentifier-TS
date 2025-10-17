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
