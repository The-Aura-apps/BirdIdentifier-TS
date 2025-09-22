import { Controller, Post, UploadedFile, UseInterceptors, Get, Param, Res, Body } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadsService } from './uploads.service';
import type { Response } from 'express';

@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body('deviceId') deviceId: string,
    @Body('type') type: 'image' | 'audio'
  ) {
    return this.uploadsService.handleUpload(file, deviceId, type);
  }

  @Get(':id')
  async downloadFile(@Param('id') id: number, @Res() res: Response) {
    const file = await this.uploadsService.getFile(id);
    res.setHeader('Content-Type', file.mime_type);
    res.setHeader('Content-Disposition', `attachment; filename=${file.file_name}`);
    res.send(file.file_data);
  }
}