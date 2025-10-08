import { Injectable, Logger } from "@nestjs/common";
import { AudioAiWrapper } from "./wrappers/audio-ai.wrapper";
import { ImageAiWrapper } from "./wrappers/image-ai.wrapper";
import { BirdInfoWrapper } from "./wrappers/bird-info.wrapper";
import { BirdAiResponse, IdentificationResult, BirdInfo } from "./types";

@Injectable()
export class AiService {
    private readonly logger = new Logger(AiService.name);
    private readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    private readonly MIN_CONFIDENCE = 0.7;
    constructor(
        private readonly imageAi: ImageAiWrapper,
        private readonly audioAi: AudioAiWrapper,
        private readonly birdInfo: BirdInfoWrapper,
    ) {}

    /**
     * Process uploaded file for bird identification
     * @param fileData Buffer of the uploaded file
     * @param type 'image' or 'audio' to determine processing path
     * @returns BirdAiResponse with status and results
     */
    async process(
        fileData: Buffer,
        type: "image" | "audio",
    ): Promise<BirdAiResponse> {
        try {
            // Validate file size to prevent large file processing
            if (fileData.length > this.MAX_FILE_SIZE) {
                this.logger.warn(`File too large: ${fileData.length} bytes`);
                return {
                    status: "failed",
                    error: "File size exceeds 10MB limit",
                };
            }

            if (fileData.length === 0) {
                return { status: "failed", error: "Empty file provided" };
            }

            this.logger.log(
                `Processing ${type} file (${fileData.length} bytes)`,
            );

            // Identify bird species using appropriate wrapper
            const identification = await (type === "image"
                ? this.imageAi.identify(fileData)
                : this.audioAi.identify(fileData));

            if (!identification) {
                return { status: "failed", error: "AI returned no result" };
            }

            // Validate scientific name
            if (
                !identification.scientificName ||
                identification.scientificName.trim() === ""
            ) {
                this.logger.warn("AI returned empty scientific name");
                return {
                    status: "failed",
                    error: "No bird species identified",
                };
            }

            const confidence = identification.confidence ?? 0;

            // Low confidence = uncertain
            if (confidence < this.MIN_CONFIDENCE) {
                this.logger.log(
                    `Low confidence (${confidence}) for ${identification.scientificName}`,
                );
                return {
                    status: "uncertain",
                    confidence,
                    result: { scientificName: identification.scientificName },
                };
            }

            // Fetch detailed bird information
            let info: BirdInfo;
            try {
                info = await this.birdInfo.fetchInfo(
                    identification.scientificName,
                );
            } catch (err) {
                this.logger.warn(
                    `Failed to fetch bird info for ${identification.scientificName}: ${err.message}`,
                );
                // Fallback: identified but with minimal info
                return {
                    status: "identified",
                    confidence,
                    result: {
                        scientificName: identification.scientificName,
                        commonName: "Unknown",
                    } as BirdInfo,
                };
            }

            this.logger.log(
                `Successfully identified: ${info.scientificName} (${confidence})`,
            );

            return {
                status: "identified",
                confidence,
                result: info,
            };
        } catch (err) {
            this.logger.error(
                `AI processing failed: ${err.message}`,
                err.stack,
            );
            return {
                status: "failed",
                error: err.message || "Unknown AI processing error",
            };
        }
    }
}
