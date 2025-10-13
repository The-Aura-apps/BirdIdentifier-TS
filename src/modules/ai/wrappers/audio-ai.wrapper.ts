import { Injectable, Logger } from "@nestjs/common";
import { IdentificationResult } from "../types";
import { promises as fs } from "fs";
import { spawn } from "child_process";
import * as path from "path";
import fluentFfmpeg from "fluent-ffmpeg";
import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";
import ffprobeInstaller from "@ffprobe-installer/ffprobe";
import { Readable } from "stream";

// Set paths for FFmpeg and FFprobe
fluentFfmpeg.setFfmpegPath(ffmpegInstaller.path);
fluentFfmpeg.setFfprobePath(ffprobeInstaller.path);

@Injectable()
export class AudioAiWrapper {
    private readonly logger = new Logger(AudioAiWrapper.name);
    private readonly TMP_DIR = path.resolve("./tmp");
    private readonly DOCKER_TIMEOUT = 60000; // 60 seconds
    private readonly MAX_AUDIO_SIZE = 10 * 1024 * 1024; // 10MB
    private readonly BIRDNET_IMAGE = "birdnet:latest"; // Use a specific, verified image
    constructor() {
        this.ensureTmpDir();
    }

    /**
     * Ensure tmp directory exists
     */
    private async ensureTmpDir(): Promise<void> {
        try {
            await fs.mkdir(this.TMP_DIR, { recursive: true });
            this.logger.log(`Temporary directory ensured: ${this.TMP_DIR}`);
        } catch (err) {
            this.logger.error(`Failed to create tmp directory: ${err.message}`);
        }
    }

    /**
     * Convert audio to WAV if needed for BirdNET compatibility
     * @param buffer Input audio buffer
     * @returns Converted buffer or original if already WAV
     */
    private async convertToWavIfNeeded(buffer: Buffer): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            const inputStream = Readable.from(buffer);
            fluentFfmpeg.ffprobe(inputStream, (err, metadata) => {
                if (err) {
                    this.logger.error(
                        `Format detection failed: ${err.message}`,
                    );
                    return reject(
                        new Error(`Format detection failed: ${err.message}`),
                    );
                }

                const format = metadata.format.format_name.toLowerCase();
                const supported = ["wav", "mp3", "aac", "m4a"];
                if (!supported.includes(format)) {
                    this.logger.error(`Unsupported audio format: ${format}`);
                    return reject(
                        new Error(`Unsupported audio format: ${format}`),
                    );
                }

                if (format === "wav") {
                    this.logger.log(
                        "Input is already WAV, no conversion needed",
                    );
                    return resolve(buffer);
                }

                this.logger.log(`Converting ${format} to WAV`);
                const outputBuffers: Buffer[] = [];
                fluentFfmpeg(Readable.from(buffer))
                    .inputFormat(format)
                    .audioCodec("pcm_s16le")
                    .format("wav")
                    .on("error", (err) => {
                        this.logger.error(
                            `Conversion to WAV failed: ${err.message}`,
                        );
                        reject(
                            new Error(
                                `Conversion to WAV failed: ${err.message}`,
                            ),
                        );
                    })
                    .on("end", () => {
                        const result = Buffer.concat(outputBuffers);
                        this.logger.log(
                            `Converted to WAV: ${result.length} bytes`,
                        );
                        resolve(result);
                    })
                    .pipe()
                    .on("data", (chunk) => outputBuffers.push(chunk));
            });
        });
    }

    /**
     * Validate WAV file format
     * @param buffer Buffer to check
     */
    private validateWavFormat(buffer: Buffer): boolean {
        if (buffer.length < 12) {
            this.logger.error("Buffer too short for WAV format");
            return false;
        }
        if (
            buffer.toString("ascii", 0, 4) !== "RIFF" ||
            buffer.toString("ascii", 8, 12) !== "WAVE"
        ) {
            this.logger.error("Invalid WAV headers");
            return false;
        }
        this.logger.log("WAV format validated successfully");
        return true;
    }

    /**
     * Identify bird from audio buffer using BirdNET
     * @param file Audio buffer
     * @returns IdentificationResult
     */
    async identify(file: Buffer): Promise<IdentificationResult> {
        // Validate audio size
        if (file.length > this.MAX_AUDIO_SIZE) {
            this.logger.error(`Audio file too large: ${file.length} bytes`);
            throw new Error(`Audio file too large: ${file.length} bytes`);
        }

        if (file.length === 0) {
            this.logger.error("Empty audio buffer provided");
            throw new Error("Empty audio buffer provided");
        }

        // Convert to WAV if needed
        let wavBuffer: Buffer;
        try {
            wavBuffer = await this.convertToWavIfNeeded(file);
        } catch (err) {
            this.logger.error(`Failed to convert audio: ${err.message}`);
            throw err;
        }

        // Validate WAV format
        if (!this.validateWavFormat(wavBuffer)) {
            this.logger.error("Converted file is not a valid WAV file");
            throw new Error("Converted file is not a valid WAV file");
        }

        const timestamp = Date.now();
        const inputFile = path.join(
            this.TMP_DIR,
            `birdnet_input_${timestamp}.wav`,
        );
        const outputFile = path.join(
            this.TMP_DIR,
            `birdnet_output_${timestamp}.json`,
        );

        // Convert Windows path to POSIX-style for Docker
        const hostPath = path
            .resolve(this.TMP_DIR)
            .replace(/\\/g, "/")
            .replace(/^([A-Z]):/, (_, drive) => `/${drive.toLowerCase()}`);
        const volumePath = `${hostPath}:/workspace`;
        this.logger.debug(`Docker volume path: ${volumePath}`);

        try {
            // Write audio to tmp file
            await fs.writeFile(inputFile, wavBuffer);
            this.logger.log(
                `Audio saved to ${inputFile} (${wavBuffer.length} bytes)`,
            );

            // Run BirdNET Docker container
            const dockerCmd = [
                "run",
                "--rm",
                "--entrypoint",
                "", // Explicitly clear entrypoint
                "-v",
                volumePath,
                this.BIRDNET_IMAGE,
                "python3",
                "-m",
                "birdnet_analyzer",
                "--i",
                `/workspace/${path.basename(inputFile)}`,
                "--o",
                `/workspace/${path.basename(outputFile)}`,
                "--format",
                "json",
            ];

            this.logger.log("Running BirdNET analysis via Docker...");
            await this.runDockerWithTimeout(dockerCmd, this.DOCKER_TIMEOUT);

            // Check if output file exists
            await fs.access(outputFile);

            // Read and parse results
            const raw = await fs.readFile(outputFile, "utf-8");
            let detections: any[];

            try {
                detections = JSON.parse(raw);
            } catch (err) {
                this.logger.error(
                    `Failed to parse BirdNET output: ${err.message}`,
                );
                throw new Error("Invalid JSON from BirdNET");
            }

            // If no detections, return unknown
            if (!Array.isArray(detections) || detections.length === 0) {
                this.logger.warn("No bird detected in audio");
                return { scientificName: "", confidence: 0 };
            }

            // Get best detection (highest confidence)
            const best = detections
                .filter(
                    (d) =>
                        d.scientific_name && typeof d.confidence === "number",
                )
                .sort((a, b) => b.confidence - a.confidence)[0];

            if (!best) {
                this.logger.warn("No valid detection found");
                return { scientificName: "", confidence: 0 };
            }

            this.logger.log(
                `BirdNET identified: ${best.scientific_name} (confidence: ${best.confidence})`,
            );

            return {
                scientificName: best.scientific_name || "",
                confidence: Number(best.confidence) || 0,
            };
        } catch (error) {
            this.logger.error(
                `BirdNET analysis failed: ${error.message}`,
                error.stack,
            );
            throw error;
        } finally {
            // Always clean up temp files
            await this.cleanup(inputFile, outputFile);
        }
    }

    /**
     * Run Docker command with timeout
     * @param dockerCmd Docker command array
     * @param timeout Timeout in ms
     */
    private runDockerWithTimeout(
        dockerCmd: string[],
        timeout: number,
    ): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            const proc = spawn("docker", dockerCmd, { stdio: "pipe" });
            let stdout = "";
            let stderr = "";
            let timedOut = false;

            // Set timeout for process
            const timer = setTimeout(() => {
                timedOut = true;
                proc.kill("SIGTERM");
                reject(
                    new Error(`BirdNET analysis timed out after ${timeout}ms`),
                );
            }, timeout);

            // Capture stdout
            proc.stdout?.on("data", (data) => {
                stdout += data.toString();
                this.logger.debug(`Docker stdout: ${data}`);
            });

            // Capture stderr
            proc.stderr?.on("data", (data) => {
                stderr += data.toString();
                this.logger.debug(`Docker stderr: ${data}`);
            });

            proc.on("error", (err) => {
                clearTimeout(timer);
                this.logger.error(`Docker spawn error: ${err.message}`);
                reject(new Error(`Failed to spawn Docker: ${err.message}`));
            });

            proc.on("close", (code) => {
                clearTimeout(timer);

                if (timedOut) {
                    return; // Already rejected
                }

                if (code === 0) {
                    this.logger.log("Docker command executed successfully");
                    resolve();
                } else {
                    this.logger.error(`Docker stderr: ${stderr}`);
                    reject(
                        new Error(
                            `BirdNET exited with code ${code}: ${stderr}`,
                        ),
                    );
                }
            });
        });
    }

    /**
     * Clean up temporary files
     * @param files Files to delete
     */
    private async cleanup(...files: string[]): Promise<void> {
        for (const file of files) {
            try {
                await fs.unlink(file);
                this.logger.log(`Cleaned up: ${path.basename(file)}`);
            } catch (err) {
                if (err.code === "ENOENT") {
                    this.logger.debug(
                        `File ${file} does not exist, skipping cleanup`,
                    );
                } else {
                    this.logger.warn(
                        `Could not delete ${file}: ${err.message}`,
                    );
                }
            }
        }
    }
}
