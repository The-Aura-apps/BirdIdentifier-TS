import { Injectable, Logger } from '@nestjs/common';
import { IdentificationResult } from '../types';
import { ConfigService } from '@nestjs/config';
import FormData from 'form-data';
import axios from 'axios';
import { Readable } from 'stream';

@Injectable()
export class AudioAiWrapper {
    private readonly logger = new Logger(AudioAiWrapper.name);
    private readonly birdnetUrl: string;
    private readonly REQUEST_TIMEOUT = 60000; // 60 seconds for audio processing
    private readonly MAX_AUDIO_SIZE = 10 * 1024 * 1024; // 10MB for audio
    private readonly MIN_CONFIDENCE = 0.1; // BirdNET threshold

    constructor(private configService: ConfigService) {
        this.birdnetUrl = this.configService.get<string>('BIRDNET_URL') || 'http://birdnet:8080';
        this.logger.log(`BirdNET service URL: ${this.birdnetUrl}`);
    }

    /**
     * Identify a bird from an audio buffer using BirdNET-Analyzer
     * @param file Buffer of the audio file
     * @returns IdentificationResult { scientificName, confidence }
     */
    async identify(file: Buffer): Promise<IdentificationResult> {
        try {
            // Validate audio size
            if (file.length > this.MAX_AUDIO_SIZE) {
                throw new Error(
                    `Audio too large: ${file.length} bytes (max: ${this.MAX_AUDIO_SIZE})`,
                );
            }

            if (file.length === 0) {
                throw new Error('Empty audio buffer provided');
            }

            this.logger.log(`Processing audio file (${file.length} bytes)`);

            // Detect audio format
            const mimeType = this.detectAudioMimeType(file);
            const extension = this.getExtensionFromMimeType(mimeType);

            this.logger.log(`Detected audio format: ${mimeType} (.${extension})`);

            // Prepare form data for BirdNET API
            const formData = new FormData();

            // Convert buffer to stream for form-data
            const stream = Readable.from(file);
            formData.append('audio', stream, {
                filename: `audio.${extension}`,
                contentType: mimeType,
            });

            // Optional: Add analysis parameters
            // lat/lon can be added if you have location data
            // formData.append('lat', '40.7128');
            // formData.append('lon', '-74.0060');

            // Minimum confidence threshold
            formData.append('min_conf', this.MIN_CONFIDENCE.toString());

            // Validate file size before upload
            if (file.length > this.MAX_AUDIO_SIZE) {
                throw new Error(`Audio file exceeds maximum size of ${this.MAX_AUDIO_SIZE} bytes`);
            }

            // Call BirdNET API
            const response = await axios.post(`${this.birdnetUrl}/analyze`, formData, {
                headers: {
                    ...formData.getHeaders(),
                },
                timeout: this.REQUEST_TIMEOUT,
            });

            // Parse BirdNET response
            const result = this.parseBirdNetResponse(response.data);

            this.logger.log(
                `Audio identified: ${result.scientificName || 'Unknown'} (${result.confidence})`,
            );

            return result;
        } catch (err) {
            this.logger.error(`Audio AI identification failed: ${err.message}`, err.stack);

            // Check if it's a network error
            if (err.code === 'ECONNREFUSED') {
                throw new Error(
                    'BirdNET service unavailable. Please ensure the service is running.',
                );
            }

            throw err;
        }
    }

    /**
     * Parse BirdNET API response and extract the best match
     * BirdNET returns an array of detections with timestamps
     */
    private parseBirdNetResponse(data: any): IdentificationResult {
        this.logger.debug(`BirdNET raw response: ${JSON.stringify(data)}`);

        // BirdNET response format:
        // {
        //   "results": [
        //     {
        //       "start": 0.0,
        //       "end": 3.0,
        //       "scientific_name": "Turdus migratorius",
        //       "common_name": "American Robin",
        //       "confidence": 0.8542
        //     }
        //   ]
        // }

        if (!data || !data.results || !Array.isArray(data.results) || data.results.length === 0) {
            this.logger.warn('No bird detections in audio');
            return {
                scientificName: '',
                confidence: 0,
            };
        }

        // Find the detection with highest confidence
        const bestMatch = data.results.reduce((best: any, current: any) => {
            return (current.confidence || 0) > (best.confidence || 0) ? current : best;
        }, data.results[0]);

        // Extract scientific name and confidence
        const scientificName = bestMatch.scientific_name || bestMatch.scientificName || '';
        const confidence = bestMatch.confidence || 0;

        // Log all detections for debugging
        if (data.results.length > 1) {
            this.logger.log(`Found ${data.results.length} detections. Top matches:`);
            data.results.slice(0, 3).forEach((detection: any, index: number) => {
                this.logger.log(
                    `  ${index + 1}. ${detection.scientific_name} (${detection.confidence.toFixed(3)})`,
                );
            });
        }

        return {
            scientificName,
            confidence: Math.max(0, Math.min(1, confidence)),
        };
    }

    /**
     * Detect audio MIME type from file buffer signature
     */
    private detectAudioMimeType(buffer: Buffer): string {
        // WAV: "RIFF....WAVE"
        if (
            buffer.length >= 12 &&
            buffer[0] === 0x52 &&
            buffer[1] === 0x49 &&
            buffer[2] === 0x46 &&
            buffer[3] === 0x46 &&
            buffer[8] === 0x57 &&
            buffer[9] === 0x41 &&
            buffer[10] === 0x56 &&
            buffer[11] === 0x45
        ) {
            return 'audio/wav';
        }

        // MP3: ID3 or 0xFF 0xFB
        if (
            (buffer[0] === 0x49 && buffer[1] === 0x44 && buffer[2] === 0x33) || // ID3
            (buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0) // MPEG sync
        ) {
            return 'audio/mpeg';
        }

        // FLAC: "fLaC"
        if (
            buffer.length >= 4 &&
            buffer[0] === 0x66 &&
            buffer[1] === 0x4c &&
            buffer[2] === 0x61 &&
            buffer[3] === 0x43
        ) {
            return 'audio/flac';
        }

        // OGG: "OggS"
        if (
            buffer.length >= 4 &&
            buffer[0] === 0x4f &&
            buffer[1] === 0x67 &&
            buffer[2] === 0x67 &&
            buffer[3] === 0x53
        ) {
            return 'audio/ogg';
        }

        // M4A/AAC: "ftypM4A"
        if (
            buffer.length >= 8 &&
            buffer[4] === 0x66 &&
            buffer[5] === 0x74 &&
            buffer[6] === 0x79 &&
            buffer[7] === 0x70
        ) {
            return 'audio/mp4';
        }

        // Default to WAV (most common for bird recordings)
        this.logger.warn('Could not detect audio format, defaulting to WAV');
        return 'audio/wav';
    }

    /**
     * Get file extension from MIME type
     */
    private getExtensionFromMimeType(mimeType: string): string {
        const extensions: Record<string, string> = {
            'audio/wav': 'wav',
            'audio/wave': 'wav',
            'audio/x-wav': 'wav',
            'audio/mpeg': 'mp3',
            'audio/mp3': 'mp3',
            'audio/flac': 'flac',
            'audio/ogg': 'ogg',
            'audio/mp4': 'm4a',
            'audio/aac': 'aac',
        };

        return extensions[mimeType.toLowerCase()] || 'wav';
    }

    /**
     * Health check for BirdNET service
     */
    async healthCheck(): Promise<boolean> {
        try {
            const response = await axios.get(`${this.birdnetUrl}/health`, {
                timeout: 5000,
            });
            return response.status === 200;
        } catch (err) {
            this.logger.error(`BirdNET health check failed: ${err.message}`);
            return false;
        }
    }
}
