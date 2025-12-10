import { Injectable, Logger } from '@nestjs/common';
import { AudioAiWrapper } from './wrappers/audio-ai.wrapper';
import { ImageAiWrapper } from './wrappers/image-ai.wrapper';
import { BirdInfoWrapper } from './wrappers/bird-info.wrapper';
import { BirdAiResponse, IdentificationResult, BirdInfo } from './types';
import { BirdsService } from '../bird/birds/birds.service';
//import { DataCollectorService } from '../data-collector/data-collector.service';

@Injectable()
export class AiService {
    private readonly logger = new Logger(AiService.name);
    private readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    private readonly MIN_CONFIDENCE = 0.7;
    constructor(
        private readonly imageAi: ImageAiWrapper,
        private readonly audioAi: AudioAiWrapper,
        private readonly birdInfo: BirdInfoWrapper,
        //private readonly dataCollector: DataCollectorService,
        private readonly birdsService: BirdsService,
    ) {}

    /**
     * Process uploaded file for bird identification
     * @param fileData Buffer of the uploaded file
     * @param type 'image' or 'audio' to determine processing path
     * @returns BirdAiResponse with status and results
     */
    async process(fileData: Buffer, type: string): Promise<BirdAiResponse> {
        try {
            // Normalize type to remove extra quotes or unexpected characters
            const normalizedType = type.replace(/['"]+/g, '').trim().toLowerCase();
            this.logger.log(`Raw type: ${type}, Normalized type: ${normalizedType}`);

            // Validate file type
            if (!['image', 'audio'].includes(normalizedType)) {
                this.logger.error(`Invalid file type: ${normalizedType}`);
                return {
                    status: 'failed',
                    confidence: null,
                    error: `Invalid file type "${normalizedType}". Only image and audio files are supported.`,
                };
            }

            // Validate file size to prevent large file processing
            if (fileData.length > this.MAX_FILE_SIZE) {
                this.logger.warn(`File too large: ${fileData.length} bytes`);
                return {
                    status: 'failed',
                    confidence: null,
                    error: `File size (${(fileData.length / 1024 / 1024).toFixed(2)}MB) exceeds the 10MB limit.`,
                };
            }

            if (fileData.length === 0) {
                return {
                    status: 'failed',
                    confidence: null,
                    error: 'Empty file provided. Please upload a valid image or audio file.',
                };
            }

            this.logger.log(`Processing ${normalizedType} file (${fileData.length} bytes)`);

            // Identify bird species using appropriate wrapper
            const identification = await (normalizedType === 'image'
                ? this.imageAi.identify(fileData)
                : this.audioAi.identify(fileData));

            if (!identification) {
                return {
                    status: 'failed',
                    confidence: null,
                    error: 'AI could not analyze the file. The image or audio may be unclear or corrupted.',
                };
            }

            // Validate scientific name
            if (!identification.scientificName || identification.scientificName.trim() === '') {
                this.logger.warn('AI returned empty scientific name');
                return {
                    status: 'failed',
                    confidence: null,
                    error: 'No bird species could be identified in the uploaded file. Please try a clearer image or audio recording.',
                };
            }

            const confidence = identification.confidence ?? 0;

            // Low confidence = uncertain
            if (confidence < this.MIN_CONFIDENCE) {
                const confidencePercent = (confidence * 100).toFixed(1);
                this.logger.log(
                    `Low confidence (${confidencePercent}%) for ${identification.scientificName}`,
                );
                return {
                    status: 'uncertain',
                    confidence,
                    result: {
                        scientificName: identification.scientificName,
                        /* confidence: identification.confidence, */
                    },
                };
            }

            // Return identified result with just the scientific name
            // BirdsService.findOrCreate will handle fetching/reusing bird data
            this.logger.log(`Successfully identified: ${identification.scientificName} (${confidence})`);

            return {
                status: 'identified',
                confidence,
                result: {
                    scientificName: identification.scientificName,
                } as BirdInfo,
            };
        } catch (err) {
            this.logger.error(`AI processing failed: ${err.message}`, err.stack);
            return {
                status: 'failed',
                confidence: null,
                error: err.message || 'Unknown AI processing error',
            };
        }
    }

    /**
     * Check if bird data is incomplete
     */
    private isDataIncomplete(bird: any): boolean {
        // Check for essential fields
        const hasBasicInfo = bird.description && bird.scientificName;
        const hasMedia = bird.media && bird.media.length > 0;
        const hasCommonNames = bird.commonNames && bird.commonNames.length > 0;
        const hasTaxonomy = bird.taxonomy && bird.taxonomy.length > 0;

        return !hasBasicInfo || !hasMedia || !hasCommonNames || !hasTaxonomy;
    }
}
