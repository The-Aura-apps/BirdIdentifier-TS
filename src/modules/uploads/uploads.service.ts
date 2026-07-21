import { Injectable, NotFoundException, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Upload } from './entities/upload.entity';
import { ObservationsService } from 'src/modules/observation/observations/observations.service';
import { ImageAiWrapper } from '../ai/wrappers/image-ai.wrapper';
import { BirdsService } from '../bird/birds/birds.service';
import * as crypto from 'crypto';
import { FileUploadDto } from './dto/upload.dto';

@Injectable()
export class UploadsService {
    private readonly logger = new Logger(UploadsService.name);

    constructor(
        @InjectRepository(Upload)
        private readonly uploadRepo: Repository<Upload>,
        private readonly observationService: ObservationsService,
        private readonly imageAiWrapper: ImageAiWrapper,
        private readonly birdsService: BirdsService,
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

        this.logger.log(`Processing ${type} upload for device: ${deviceId} (SYNCHRONOUS - will wait for bird data)`);

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
                this.logger.log(`Existing upload has ${existingRepo.observations?.length || 0} observations`);
                
                // Debug: Log all observations and their status
                existingRepo.observations?.forEach((obs, index) => {
                    this.logger.log(`Observation ${index}: status=${obs.status}, hasBird=${!!obs.bird}, birdId=${obs.birdId}`);
                });

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
                this.logger.log('Duplicate file but no successful bird identification found, processing with AI (SYNCHRONOUS)...');
                
                // Create observation and WAIT for AI processing to complete
                const observation = await this.observationService.createAndProcessSync({
                    deviceId,
                    type,
                    uploadId: existingRepo.id,
                });

                return {
                    upload: existingRepo,
                    observation,
                };
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

            // Create observation and WAIT for AI processing to complete
            const observation = await this.observationService.createAndProcessSync({
                deviceId,
                type,
                uploadId: savedRepo.id,
            });

            this.logger.log(
                `Observation completed with id: ${observation.id} for upload: ${savedRepo.id}, bird: ${observation.bird?.scientificName || 'none'}`,
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

    // Looks up a file by its content checksum rather than its sequential DB id,
    // so download URLs can't be walked (/uploads/1, /uploads/2, ...).
    async getFile(checksum: string): Promise<Upload> {
        if (!checksum || !/^[a-f0-9]{64}$/i.test(checksum)) {
            throw new BadRequestException('Invalid file checksum');
        }

        try {
            const file = await this.uploadRepo.findOne({
                where: {
                    checksum,
                },
            });

            if (!file) {
                this.logger.warn(`File not found: ${checksum}`);
                throw new NotFoundException(`File with checksum ${checksum} not found`);
            }

            this.logger.log(`File retrieved: ${checksum}`);
            return file;
        } catch (err) {
            if (err instanceof NotFoundException) {
                throw err;
            }
            this.logger.error(`Error retrieving file ${checksum}: ${err.message}`);
            throw err;
        }
    }
    // Helper method to get file info without the binary data
    async getFileInfo(checksum: string) {
        const file = await this.getFile(checksum);
        return file.getFileInfo();
    }

    /**
     * Identify bird from image and refresh data from APIs
     * Always fetches fresh data even if bird exists in database
     */
    async identifyAndRefreshBird(file: FileUploadDto) {
        if (!file?.buffer) {
            this.logger.error('Upload attempted without file buffer');
            throw new BadRequestException('No file provided');
        }

        // Validate file type (only images)
        if (!file.mimetype.startsWith('image/')) {
            throw new BadRequestException('Only image files are allowed');
        }

        this.logger.log('🔍 Starting bird identification and data refresh...');

        try {
            // Step 1: Identify the bird using AI
            this.logger.log('Step 1: Identifying bird species from image...');
            const identificationResult = await this.imageAiWrapper.identify(file.buffer);

            if (!identificationResult?.scientificName) {
                this.logger.warn('Bird identification failed - no scientific name returned');
                return {
                    success: false,
                    error: 'Could not identify bird from image',
                    confidence: identificationResult?.confidence || 0,
                };
            }

            const { scientificName, confidence } = identificationResult;
            this.logger.log(`✓ Bird identified: ${scientificName} (confidence: ${confidence})`);

            // Step 2: Check if bird exists in database
            this.logger.log('Step 2: Checking if bird exists in database...');
            let bird = await this.birdsService.findByScientificName(scientificName);

            if (bird) {
                this.logger.log(`✓ Bird found in database (ID: ${bird.id}), will refresh data`);

                // Step 3: Force refresh data from APIs
                this.logger.log('Step 3: Fetching fresh data from all APIs (OpenAI, iNaturalist, Pexels)...');
                await this.birdsService.refreshBirdData(bird.id);

                // Get updated bird data
                bird = await this.birdsService.findOne(String(bird.id));
                this.logger.log('✓ Bird data refreshed successfully');

                return {
                    success: true,
                    message: 'Bird identified and data refreshed from APIs',
                    bird,
                    confidence,
                    dataRefreshed: true,
                    existedBefore: true,
                };
            } else {
                // Step 3: Create new bird with API data
                this.logger.log('Step 3: Bird not found, creating new entry with API data...');
                bird = await this.birdsService.createBirdWithAIData(scientificName);
                this.logger.log(`✓ New bird created (ID: ${bird.id}) with fresh API data`);

                return {
                    success: true,
                    message: 'Bird identified and created with fresh API data',
                    bird,
                    confidence,
                    dataRefreshed: true,
                    existedBefore: false,
                };
            }
        } catch (err) {
            this.logger.error(`Failed to identify and refresh bird: ${err.message}`, err.stack);
            
            if (err instanceof BadRequestException || err instanceof NotFoundException) {
                throw err;
            }

            return {
                success: false,
                error: err.message || 'Failed to process bird identification',
                confidence: 0,
            };
        }
    }
}
