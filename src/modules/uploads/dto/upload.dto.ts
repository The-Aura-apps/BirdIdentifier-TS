import { IsString, IsNotEmpty } from 'class-validator';

export class FileUploadDto {
    @IsString()
    @IsNotEmpty()
    originalname: string;

    @IsString()
    @IsNotEmpty()
    mimetype: string;

    buffer: Buffer;
}
