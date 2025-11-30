import { Injectable, Logger } from '@nestjs/common';
import { IdentificationResult } from '../types';
import OpenAI from 'openai';
import { ConfigService } from '@nestjs/config';
//import sharp from 'sharp'; // Added for image format conversion

@Injectable()
export class ImageAiWrapper {
    private readonly logger = new Logger(ImageAiWrapper.name);
    private client: OpenAI;
    private readonly REQUEST_TIMEOUT = 30000; // 30 seconds
    private readonly MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB for images

    constructor(private configService: ConfigService) {
        const apiKey = this.configService.get<string>('OPENAI_API_KEY'); 

         console.log(' Environment check:');
         console.log('NODE_ENV:', process.env.NODE_ENV);
         console.log('OPENAI_API_KEY exists in process.env:', !!process.env.OPENAI_API_KEY);
         console.log(
             'OPENAI_API_KEY from ConfigService:',
             apiKey ? apiKey.substring(0, 10) + '...' : 'NOT FOUND',
         );


        if (!apiKey) {
            this.logger.error('OPENAI_API_KEY not set in environment variables');
            throw new Error('OPENAI_API_KEY is required');
        }
        this.client = new OpenAI({
            apiKey,
            timeout: this.REQUEST_TIMEOUT,
        });
        this.logger.log('OpenAI client initialized for image analysis');
    }

    /**
     * Convert image to JPEG if needed for compatibility
     * @param buffer Input image buffer
     * @returns Converted buffer or original if already JPEG
     */
    // private async convertToJpegIfNeeded(buffer: Buffer): Promise<Buffer> {
    //     const format = await sharp(buffer)
    //         .metadata()
    //         .then((meta) => meta.format?.toLowerCase());
    //     const supported = ['jpeg', 'png', 'gif', 'webp', 'heic'];
    //     if (!supported.includes(format || "")) {
    //         throw new Error(`Unsupported image format: ${format}`);
    //     }

    //     if (format === 'jpeg') {
    //         return buffer;
    //     }

    //     this.logger.log(`Converting ${format} to JPEG`);
    //     return sharp(buffer).jpeg({ quality: 90 }).toBuffer();
    // }

    /**
     * Identify a bird from an image buffer using GPT-4o-mini
     * @param file Buffer of the image
     * @returns IdentificationResult { scientificName, confidence }
     */
    async identify(file: Buffer): Promise<IdentificationResult> {
        try {
            // Validate image size
            if (file.length > this.MAX_IMAGE_SIZE) {
                throw new Error(
                    `Image too large: ${file.length} bytes (max: ${this.MAX_IMAGE_SIZE})`,
                );
            }

            if (file.length === 0) {
                throw new Error('Empty image buffer provided');
            }

            // Convert to base64 for OpenAI API
            const base64Image = file.toString('base64');
            const mimeType = this.detectMimeType(file);

            this.logger.log(`Processing image (${file.length} bytes, ${mimeType})`);

            const prompt = `Identify the bird species. Return ONLY JSON:
{
  "scientificName": "Genus species",
  "confidence": 0.xx
}

Confidence guidelines:
- 0.9+: Clear photo, certain identification
- 0.7-0.89: Good visibility, confident
- Below 0.7: Poor quality or uncertain

Be honest with confidence based on image quality and visible features.`;

            // Call GPT-4o-mini
            const response = await this.client.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [
                    {
                        role: 'user',
                        content: [
                            {
                                type: 'text',
                                text: prompt,
                            },
                            {
                                type: 'image_url',
                                image_url: {
                                    url: `data:${mimeType};base64,${base64Image}`,
                                },
                            },
                        ],
                    },
                ],
                response_format: {
                    type: 'json_object',
                },
                max_tokens: 300, //Extend if needed
            });

            // Parse JSON safely
            const content = response.choices?.[0]?.message?.content;
            if (!content) {
                throw new Error('Empty response from OpenAI API');
            }

            // Parse and validate JSON
            let data: IdentificationResult;
            try {
                data = JSON.parse(content);
            } catch (prsErr) {
                this.logger.error('Failed to pars OpenAI JSON response', content);
                throw new Error('Invalid JSON from AI');
            }

            // Validate and normalize data
            if (typeof data.scientificName !== 'string') {
                throw new Error('Invalid scientificName in AI response');
            }

            if (typeof data.confidence !== 'number') {
                data.confidence = 0;
            }

            // Clamp confidence to [0, 1]
            data.confidence = Math.max(0, Math.min(1, data.confidence));

            this.logger.log(
                `[ImageAI] Bird identified: "${data.scientificName || 'Unknown'}" (confidence: ${data.confidence})`,
            );

            return data;
        } catch (err) {
            this.logger.error(`Image AI identification failed: ${err.message}`, err.stack);
            throw err; // Propagate error instead of returning default
        }
    }

    /**
     * Detect MIME type from file buffer signature
     */
    private detectMimeType(buffer: Buffer): string {
        // Check file signatures (magic numbers)
        if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
            return 'image/jpeg';
        }
        if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
            return 'image/png';
        }
        if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) {
            return 'image/gif';
        }
        if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46) {
            return 'image/webp';
        }

        // Default fallback
        return 'image/jpeg';
    }
}
