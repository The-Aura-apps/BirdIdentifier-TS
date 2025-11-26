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
    private readonly DOCKER_TIMEOUT = 120000; // 2 minutes
    private readonly MAX_AUDIO_SIZE = 10 * 1024 * 1024; // 10MB
    private readonly BIRDNET_IMAGE = 'birdnet-analyzer:latest'; // Updated image name
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
                this.logger.warn('Docker not available - audio identification will fail');
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
     * Convert audio to WAV format for BirdNET (48kHz, mono, 16-bit PCM)
     */
    private async convertToWav(buffer: Buffer): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            const outputBuffers: Buffer[] = [];

            fluentFfmpeg(Readable.from(buffer))
                .audioFrequency(48000) // BirdNET expects 48kHz
                .audioChannels(1)      // Mono
                .audioCodec('pcm_s16le') // 16-bit PCM
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
        const outputFile = path.join(this.TMP_DIR, `input_${timestamp}.BirdNET.results.csv`);

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
     * Run BirdNET in Docker container
     * Note: BirdNET-Analyzer outputs CSV by default, not JSON
     */
    private async runDockerAnalysis(inputFile: string, outputFile: string): Promise<any[]> {
        return new Promise((resolve, reject) => {
            const dockerArgs = [
                'run',
                '--rm',
                '-v',
                `${this.TMP_DIR}:/workspace`,
                '--entrypoint',
                'python3',
                this.BIRDNET_IMAGE,
                '-m',
                'birdnet_analyzer.analyze',
                '/workspace',
                '--output',
                '/workspace',
                '--min_conf',
                this.MIN_CONFIDENCE.toString(),
                '--rtype',
                'csv',
            ];

            this.logger.log('Starting BirdNET Docker container...');
            this.logger.debug(`Docker command: docker ${dockerArgs.join(' ')}`);

            const process = spawn('docker', dockerArgs, {
                stdio: 'pipe',
            });

            let stdout = '';
            let stderr = '';

            const timeout = setTimeout(() => {
                process.kill('SIGTERM');
                reject(new Error('Docker execution timeout'));
            }, this.DOCKER_TIMEOUT);

            process.stdout?.on('data', (data) => {
                stdout += data.toString();
                this.logger.debug(`Docker stdout: ${data}`);
            });

            process.stderr?.on('data', (data) => {
                stderr += data.toString();
                this.logger.debug(`Docker stderr: ${data}`);
            });

            process.on('error', (err) => {
                clearTimeout(timeout);
                reject(new Error(`Docker spawn failed: ${err.message}`));
            });

            process.on('close', async (code) => {
                clearTimeout(timeout);

                if (code !== 0) {
                    this.logger.error(`Docker exited with code ${code}: ${stderr}`);
                    return reject(new Error(`BirdNET Docker failed: ${stderr}`));
                }

                try {
                    // Parse CSV results
                    const detections = await this.parseCSVResults(outputFile);
                    this.logger.log(`Analysis complete: ${detections.length} detections`);
                    resolve(detections);
                } catch (err) {
                    reject(new Error(`Failed to parse output: ${err.message}`));
                }
            });
        });
    }

    /**
     * Parse CSV output from BirdNET
     * CSV format: Selection,View,Channel,Begin Time (s),End Time (s),Low Freq (Hz),High Freq (Hz),Species Code,Common Name,Confidence
     */
    private async parseCSVResults(outputFile: string): Promise<any[]> {
        try {
            const data = await fs.readFile(outputFile, 'utf-8');
            const lines = data.trim().split('\n');

            if (lines.length <= 1) {
                // Only header or empty
                return [];
            }

            const detections = [];

            // Skip header line
            for (let i = 1; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line) continue;

                // Parse CSV line (handle quoted fields)
                const parts = this.parseCSVLine(line);

                if (parts.length >= 10) {
                    // Get species name and confidence
                    const scientificName = parts[7]; // Species Code column
                    const confidence = parseFloat(parts[9]); // Confidence column

                    if (scientificName && !isNaN(confidence)) {
                        detections.push({
                            scientific_name: scientificName,
                            confidence: confidence,
                            start_time: parseFloat(parts[3]),
                            end_time: parseFloat(parts[4]),
                        });
                    }
                }
            }

            return detections;
        } catch (err) {
            throw new Error(`CSV parsing failed: ${err.message}`);
        }
    }

    /**
     * Simple CSV line parser (handles quoted fields)
     */
    private parseCSVLine(line: string): string[] {
        const result = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];

            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }

        result.push(current.trim());
        return result;
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
            return (prev.confidence || 0) > (current.confidence || 0) ? prev : current;
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