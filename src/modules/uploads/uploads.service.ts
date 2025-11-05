import {
    Injectable,
    NotFoundException,
    Logger,
    BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Upload } from './entities/upload.entity';
import { ObservationsService } from 'src/modules/observation/observations/observations.service';
import * as crypto from 'crypto';
import { FileUploadDto } from './dto/upload.dto';

@Injectable()
export class UploadsService {
    private readonly logger = new Logger(UploadsService.name);

    constructor(
        @InjectRepository(Upload)
        private readonly uploadRepo: Repository<Upload>,
        private readonly observationService: ObservationsService
    ) {}

    async handleUpload(
        file: FileUploadDto,
        deviceId: string,
        type: 'image' | 'audio'
    ) {
        if (!file?.buffer) {
            this.logger.error('Upload attempted without file buffer');
            throw new BadRequestException('No file provided');
        }

        if (!deviceId) {
            this.logger.error('Upload attempted without deviceId');
            throw new BadRequestException('Device ID required');
        }

        this.logger.log(`Processing ${type} upload for device: ${deviceId}`);

        try {
            const checksum = crypto
                .createHash('sha256')
                .update(file.buffer)
                .digest('hex');

            // Check for duplicate
            const existingRepo = await this.uploadRepo.findOne({
                where: {
                    checksum,
                },
            });
            if (existingRepo) {
                this.logger.warn(
                    `Duplicate file detected: ${checksum}, reusing existing upload`
                );

                // Link it with an observation
                const observation = await this.observationService.create({
                    deviceId,
                    type,
                    uploadId: existingRepo.id,
                });

                return {
                    upload: existingRepo,
                    observation,
                };

                /*                 return {
                    upload: existingUpload,
                    observation,
                    isDuplicate: true
                };
            }
 */
            }

            // Create new upload
            const upload = this.uploadRepo.create({
                fileName: file.originalname,
                mimeType: file.mimetype,
                fileData: file.buffer,
                checksum,
                type,
            });

            const savedRepo = await this.uploadRepo.save(upload);
            this.logger.log(`File saved with id: ${savedRepo.id}`);

            // Link it with an observation
            const observation = await this.observationService.create({
                deviceId,
                type,
                uploadId: savedRepo.id,
            });

            this.logger.log(
                `Observation created with id: ${observation.id} for upload: ${savedRepo.id}`
            );

            return {
                upload: savedRepo,
                observation,
            };
        } catch (err) {
            this.logger.error(
                `Failed to handle upload for device ${deviceId}: ${err.message}`,
                err.stack
            );
            throw err;
        }
    }

    // Chane name this shet function
    async getFile(id: number): Promise<Upload> {
        if (!id || id < 1) {
            throw new BadRequestException('Invalid file ID');
        }

        try {
            const file = await this.uploadRepo.findOne({
                where: {
                    id,
                },
            });

            if (!file) {
                this.logger.warn(`File not found: ${id}`);
                throw new NotFoundException(`File with id ${id} not found`);
            }

            this.logger.log(`File retrieved: ${id}`);
            return file;
        } catch (err) {
            if (err instanceof NotFoundException) {
                throw err;
            }
            this.logger.error(`Error retrieving file ${id}: ${err.message}`);
            throw err;
        }
    }
    // Helper method to get file info without the binary data
    async getFileInfo(id: number) {
        const file = await this.getFile(id);
        return file.getFileInfo();
    }
}
