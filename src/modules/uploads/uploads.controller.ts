import {
    Controller,
    Post,
    UploadedFile,
    UseInterceptors,
    Get,
    Param,
    Res,
    Body,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadsService } from './uploads.service';
import type { Response } from 'express';
import type { FileUploadDto } from './dto/upload.dto';

@Controller('uploads')
export class UploadsController {
    constructor(private readonly uploadsService: UploadsService) {}

    @Post()
    @UseInterceptors(FileInterceptor('file'))
    async uploadFile(
        @UploadedFile()
        file: FileUploadDto,
        @Body('deviceId')
        deviceId: string,
        @Body('type')
        type: 'image' | 'audio',
    ) {
        return this.uploadsService.handleUpload(
            {
                originalname: file.originalname,
                mimetype: file.mimetype,
                buffer: file.buffer,
            },
            deviceId,
            type,
        );
    }

    @Get(':id')
    async downloadFile(
        @Param('id')
        id: number,
        @Res()
        res: Response,
    ) {
        const file = await this.uploadsService.getFile(id);
        res.setHeader('Content-Type', file.mimeType);
        res.setHeader('Content-Disposition', `attachment; filename=${file.fileName}`);
        res.send(file.fileData);
    }

    @Post('identify')
    @UseInterceptors(FileInterceptor('file'))
    async identifyBid(
        @UploadedFile() file: FileUploadDto,
        @Body('deviceId') deviceId: string,
        @Body('type') type: 'image' | 'audio',
    ) {
        return this.uploadsService.identifyBird(file, deviceId, type);
    }

}
