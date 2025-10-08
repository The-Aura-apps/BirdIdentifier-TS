import { Injectable, Logger } from "@nestjs/common";
import { IdentificationResult } from "../types";
import { promises as fs } from "fs";
import { spawn } from "child_process";
import * as path from "path";
import * as fluentFfmpeg from "fluent-ffmpeg";
import * as ffmpegInstaller from "@ffmpeg-installer/ffmpeg";
import * as ffprobeInstaller from "@ffprobe-installer/ffprobe";
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

    constructor() {
        this.ensureTmpDir();
    }

    /**
     * Ensure tmp directory exists
     */
    private async ensureTmpDir(): Promise<void> {
        try {
            await fs.mkdir(this.TMP_DIR, { recursive: true });
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
                if (err)
                    return reject(
                        new Error(`Format detection failed: ${err.message}`),
                    );

                const format = metadata.format.format_name.toLowerCase();
                const supported = ["wav", "mp3", "aac", "m4a"]; // Supported formats; add more if needed
                if (!supported.includes(format)) {
                    return reject(
                        new Error(`Unsupported audio format: ${format}`),
                    );
                }

                if (format === "wav") {
                    return resolve(buffer); // No conversion needed
                }

                this.logger.log(`Converting ${format} to WAV`);
                const outputBuffers: Buffer[] = [];
                fluentFfmpeg(Readable.from(buffer))
                    .inputFormat(format)
                    .audioCodec("pcm_s16le") // Uncompressed WAV codec
                    .format("wav")
                    .on("error", reject)
                    .on("end", () => resolve(Buffer.concat(outputBuffers)))
                    .pipe()
                    .on("data", (chunk) => outputBuffers.push(chunk));
            });
        });
    }

    /**
     * Identify bird from audio buffer using BirdNET
     * @param file Audio buffer
     * @returns IdentificationResult
     */
    async identify(file: Buffer): Promise<IdentificationResult> {
        // validate audio size
        if (file.length > this.MAX_AUDIO_SIZE) {
            throw new Error(`Audio file too large: ${file.length} bytes`);
        }

        if (file.length === 0) {
            throw new Error("Empty audio buffer provided");
        }

        // Validate WAV format (check RIFF and WAVE headers)
        if (
            file.length < 12 ||
            file.toString("ascii", 0, 4) !== "RIFF" ||
            file.toString("ascii", 8, 12) !== "WAVE"
        ) {
            this.logger.error("Invalid WAV file format");
            throw new Error("Input file is not a valid WAV file");
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
        const volumePath = `${this.TMP_DIR.replace(/\\/g, "/")}/:/E:\The-Wall\Bird-I\bird-identifier-app`;

        try {
            // Write audio to tmp file
            await fs.writeFile(inputFile, file);
            this.logger.log(
                `Audio saved to ${inputFile} (${file.length} bytes)`,
            );

            // Run BirdNET Docker container
            const dockerCmd = [
                "run",
                "--rm",
                "--entrypoint",
                "", // Override entrypoint
                "-v",
                volumePath,
                "birdnet",
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

            // Get best detection (hightest confidence)
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
            throw error; // Propagate error
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
            });

            // Capture stderr
            proc.stderr?.on("data", (data) => {
                stderr += data.toString();
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
                    resolve();
                } else {
                    this.logger.error(`BirdNET stderr: ${stderr}`);
                    reject(new Error(`BirdNET exited with code ${code}`));
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