import { Injectable, NotFoundException, Logger, BadRequestException } from '@nestjs/common';
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
        private readonly observationService: ObservationsService,
    ) {}

    // async identifyBird(file: FileUploadDto, deviceId: string, type: 'image' | 'audio') {
    //     if (!file?.buffer) {
    //         this.logger.error('Upload attempted without file buffer');
    //         throw new BadRequestException('No file provided');
    //     }

    //     if (!deviceId) {
    //         this.logger.error('Upload attempted without deviceId');
    //         throw new BadRequestException('Device ID required');
    //     }

    //     this.logger.log(`Processing ${type} upload for device: ${deviceId} (SYNCHRONOUS)`);

    //     try {
    //         const checksum = crypto.createHash('sha256').update(file.buffer).digest('hex');

    //         // Check for duplicate upload
    //         const existingUpload = await this.uploadRepo.findOne({
    //             where: { checksum },
    //         });

    //         let upload: Upload;
    //         let observation: any;

    //         if (existingUpload) {
    //             this.logger.warn(`Duplicate file detected: ${checksum}, reusing existing upload`);
    //             upload = existingUpload;

    //             // Create observation for this device
    //             observation = await this.observationService.create({
    //                 deviceId,
    //                 type,
    //                 uploadId: existingUpload.id,
    //             });
    //         } else {
    //             // Create new upload
    //             upload = this.uploadRepo.create({
    //                 fileName: file.originalname,
    //                 mimeType: file.mimetype,
    //                 fileData: file.buffer,
    //                 checksum,
    //                 type,
    //             });
    //             upload = await this.uploadRepo.save(upload);
    //             this.logger.log(`File saved with id: ${upload.id}`);

    //             // Create observation
    //             observation = await this.observationService.create({
    //                 deviceId,
    //                 type,
    //                 uploadId: upload.id,
    //             });
    //         }

    //         // Wait for AI processing to complete and get bird data
    //         // The observation service should handle the AI identification
    //         const fullObservation = await this.observationService.findOne(observation.id);

    //         if (!fullObservation.bird) {
    //             throw new BadRequestException('Bird identification failed');
    //         }

    //         // Return complete bird data
    //         return fullObservation.bird;
    //     } catch (err) {
    //         this.logger.error(
    //             `Failed to identify bird for device ${deviceId}: ${err.message}`,
    //             err.stack,
    //         );
    //         throw err;
    //     }
    // }

    async handleUpload(file: FileUploadDto, deviceId: string, type: 'image' | 'audio') {
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
            const checksum = crypto.createHash('sha256').update(file.buffer).digest('hex');

            // Check for duplicate
            const existingRepo = await this.uploadRepo.findOne({
                where: {
                    checksum,
                },
                relations: ['observations', 'observations.bird'],
            });
            
            if (existingRepo) {
                this.logger.warn(`Duplicate file detected: ${checksum}, reusing existing upload`);

                // Find a successfully completed observation with bird data
                const successfulObservation = existingRepo.observations?.find(
                    obs => obs.status === 'completed' && obs.bird
                );

                if (successfulObservation) {
                    // Reuse the existing bird data without processing AI again
                    this.logger.log(
                        `Reusing existing bird data from previous observation: ${successfulObservation.bird.scientificName}`
                    );

                    // Create new observation but link to existing bird (skip AI processing)
                    const observation = await this.observationService.createWithBird({
                        deviceId,
                        type,
                        uploadId: existingRepo.id,
                        birdId: successfulObservation.bird.id,
                        aiResult: successfulObservation.aiResult,
                        confidence: successfulObservation.confidence,
                    });

                    return {
                        upload: existingRepo,
                        observation,
                    };
                }

                // No successful observation found, process normally
                this.logger.log('Duplicate file but no successful bird identification found, processing with AI...');
                
                // Link it with an observation (will trigger AI processing)
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
                `Observation created with id: ${observation.id} for upload: ${savedRepo.id}`,
            );

            return {
                upload: savedRepo,
                observation,
            };
        } catch (err) {
            this.logger.error(
                `Failed to handle upload for device ${deviceId}: ${err.message}`,
                err.stack,
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
