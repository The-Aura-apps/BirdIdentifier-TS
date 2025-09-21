import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Upload } from './entities/upload.entity';
import { ObservationsService } from 'src/observations/observations.service';
import * as crypto from 'crypto';


@Injectable()
export class UploadsService {
  constructor(
    @InjectRepository(Upload)
    private readonly uploadRepo: Repository<Upload>,
    private readonly observationService: ObservationsService,
  ) {}

  async handleUpload(file: Express.Multer.File, deviceId: string, type: 'image' | 'audio') {
    if (!file) throw new Error('No file Provided');

    const checksum = crypto.createHash('sha256').update(file.buffer).digest('hex');

    // save file
    const upload = this.uploadRepo.create({
      fileName: file.originalname,
      mimeType: file.mimetype,
      fileData: file.buffer,
      checksum,
    });
    
    const savedFile = await this.uploadRepo.save(upload);

    // Link it with an observation
    const observation = await this.observationService.create({
      deviceId,
      type,
      uploadId: upload.id,
    })

    return { savedFile, observation}
  }

  async getFile(id: number): Promise<Upload> {
    const file = await this.uploadRepo.findOne({ where: { id } });
    if (!file) throw new NotFoundException(`File with id ${id} not found`);
    return file;
  }
}
