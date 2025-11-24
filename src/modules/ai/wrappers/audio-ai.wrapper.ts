import { Injectable, Logger } from '@nestjs/common';
import { IdentificationResult } from '../types';
import { promises as fs } from 'fs';
import { spawn } from 'child_process';
import * as path from 'path';
import * as os from 'os';
import fluentFfmpeg from 'fluent-ffmpeg';
import { Readable } from 'stream';

@Injectable()
export class AudioAiWrapper {
    private readonly logger = new Logger(AudioAiWrapper.name);
    private readonly TMP_DIR = path.join(os.tmpdir(), 'birdnet-audio');
    private readonly DOCKER_TIMEOUT = 120000;
    private readonly MAX_AUDIO_SIZE = 10 * 1024 * 1024;
    private readonly BIRDNET_IMAGE = 'ghcr.io/kahst/birdnet-analyzer:latest';
    private readonly MIN_CONFIDENCE = 0.1;

    constructor() {
        this.ensureTmpDir();
        this.checkDockerAvailability();
    }

    private async ensureTmpDir(): Promise<void> {
        try {
            await fs.mkdir(this.TMP_DIR, { recursive: true });
            this.logger.log(`Temporary directory ready: ${this.TMP_DIR}`);
        } catch (err) {
            this.logger.error(`Failed to create tmp directory: ${err.message}`);
            throw err;
        }
    }

    /**
     * Check if Docker is available
     */
    private async checkDockerAvailability(): Promise<void> {
        return new Promise((resolve) => {
            const docker = spawn('docker', ['--version']);

            docker.on('error', () => {
                this.logger.warn('Docker not available - audio identification may fail');
                resolve();
            });

            docker.on('close', (code) => {
                if (code === 0) {
                    this.logger.log('Docker is available');
                } else {
                    this.logger.warn('Docker command failed');
                }
                resolve();
            });
        });
    }

    /**
     * Convert audio to WAV format for BirdNET
     */
    private async convertToWav(buffer: Buffer): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            const outputBuffers: Buffer[] = [];

            fluentFfmpeg(Readable.from(buffer))
                .audioFrequency(48000)
                .audioChannels(1)
                .audioCodec('pcm_s16le')
                .format('wav')
                .on('error', (err) => reject(new Error(`Conversion failed: ${err.message}`)))
                .on('end', () => {
                    const result = Buffer.concat(outputBuffers);
                    this.logger.log(`Converted to WAV: ${result.length} bytes`);
                    resolve(result);
                })
                .pipe()
                .on('data', (chunk) => outputBuffers.push(chunk));
        });
    }

    /**
     * Identify bird from audio using BirdNET Docker container
     */
    async identify(file: Buffer): Promise<IdentificationResult> {
        if (file.length === 0) {
            throw new Error('Empty audio buffer');
        }

        if (file.length > this.MAX_AUDIO_SIZE) {
            throw new Error(`Audio too large: ${file.length} bytes`);
        }

        const timestamp = Date.now();
        const inputFile = path.join(this.TMP_DIR, `input_${timestamp}.wav`);
        const outputFile = path.join(this.TMP_DIR, `output_${timestamp}.json`);

        try {
            // Convert audio to WAV format
            const wavBuffer = await this.convertToWav(file);
            await fs.writeFile(inputFile, wavBuffer);

            // Run Docker analysis
            const detections = await this.runDockerAnalysis(inputFile, outputFile);

            // Process results
            return this.processDetections(detections);
        } catch (error) {
            this.logger.error(`Analysis failed: ${error.message}`, error.stack);
            throw error;
        } finally {
            await this.cleanup(inputFile, outputFile);
        }
    }

    /**
     * Run BirdNET analysis in Docker container
     */
    private async runDockerAnalysis(inputFile: string, outputFile: string): Promise<any[]> {
        return new Promise((resolve, reject) => {
            const dockerArgs = [
                'run',
                '--rm',
                '-v',
                `${this.TMP_DIR}:/workspace`,
                this.BIRDNET_IMAGE,
                '--i',
                `/workspace/${path.basename(inputFile)}`,
                '--o',
                `/workspace/${path.basename(outputFile)}`,
                '--min_conf',
                this.MIN_CONFIDENCE.toString(),
                '--rtype',
                'json',
            ];

            this.logger.log('Starting BirdNET Docker container...');
            this.logger.debug(`Docker command: docker ${dockerArgs.join(' ')}`);

            const process = spawn('docker', dockerArgs, {
                stdio: 'pipe',
                timeout: this.DOCKER_TIMEOUT,
            });

            let stdout = '';
            let stderr = '';

            process.stdout?.on('data', (data) => {
                stdout += data.toString();
                this.logger.debug(`Docker stdout: ${data}`);
            });

            process.stderr?.on('data', (data) => {
                stderr += data.toString();
                this.logger.debug(`Docker stderr: ${data}`);
            });

            process.on('error', (err) => {
                reject(new Error(`Docker spawn failed: ${err.message}`));
            });

            process.on('close', async (code) => {
                if (code !== 0) {
                    this.logger.error(`Docker exited with code ${code}: ${stderr}`);
                    return reject(new Error(`BirdNET Docker failed: ${stderr}`));
                }

                try {
                    const data = await fs.readFile(outputFile, 'utf-8');
                    const detections = JSON.parse(data);
                    this.logger.log(`Analysis complete: ${detections.length} detections`);
                    resolve(detections);
                } catch (err) {
                    reject(new Error(`Failed to parse output: ${err.message}`));
                }
            });
        });
    }

    /**
     * Process detections to find best match
     */
    private processDetections(detections: any[]): IdentificationResult {
        if (!Array.isArray(detections) || detections.length === 0) {
            this.logger.warn('No birds detected');
            return { scientificName: '', confidence: 0 };
        }

        // Find the detection with highest confidence
        const best = detections.reduce((prev, current) => {
            return prev.confidence > current.confidence ? prev : current;
        });

        if (!best || !best.scientific_name) {
            return { scientificName: '', confidence: 0 };
        }

        this.logger.log(`Best match: ${best.scientific_name} (${best.confidence.toFixed(3)})`);

        return {
            scientificName: best.scientific_name.trim(),
            confidence: Number(best.confidence),
        };
    }

    /**
     * Clean up temporary files
     */
    private async cleanup(...files: string[]): Promise<void> {
        for (const file of files) {
            try {
                await fs.unlink(file);
                this.logger.debug(`Cleaned up: ${path.basename(file)}`);
            } catch (err: any) {
                if (err.code !== 'ENOENT') {
                    this.logger.warn(`Cleanup failed for ${file}: ${err.message}`);
                }
            }
        }
    }
}
