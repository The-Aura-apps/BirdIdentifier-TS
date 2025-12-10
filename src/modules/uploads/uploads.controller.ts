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
        @UploadedFile() file: FileUploadDto,
        @Body('deviceId') deviceId: string,
        @Body('type') type: 'image' | 'audio',
    ) {
        const result = await this.uploadsService.handleUpload(
            {
                originalname: file.originalname,
                mimetype: file.mimetype,
                buffer: file.buffer,
            },
            deviceId,
            type,
        );

        // Check for errors or low confidence
        if (result.observation.status === 'failed') {
            return {
                success: false,
                error: result.observation.errorMessage || 'Bird identification failed',
                confidence: result.observation.confidence,
                status: result.observation.status,
                observation: {
                    id: result.observation.id,
                    createdAt: result.observation.createdAt,
                },
            };
        }

        // Return bird data on success
        return {
            success: true,
            bird: result.observation.bird,
            confidence: result.observation.confidence,
            status: result.observation.status,
            observation: {
                id: result.observation.id,
                createdAt: result.observation.createdAt,
            },
        };
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
}
