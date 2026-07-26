import { Injectable, Logger } from '@nestjs/common';
import { IdentificationResult } from '../types';
import OpenAI from 'openai';
import { ConfigService } from '@nestjs/config';
import sharp from 'sharp';

@Injectable()
export class ImageAiWrapper {
    private readonly logger = new Logger(ImageAiWrapper.name);
    private client: OpenAI;
    private readonly REQUEST_TIMEOUT = 60000; // 60 seconds (enough after compression)
    private readonly MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB for images
    private readonly MAX_DIMENSION = 1024; // Resize to max 1024px (good for bird ID)
    private readonly JPEG_QUALITY = 85; // Good balance of quality vs size

    constructor(private configService: ConfigService) {
        const apiKey = this.configService.get<string>('OPENAI_API_KEY');

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
     * Compress and optimize image for faster processing
     * Resizes to max 1024px and converts to JPEG
     */
    private async compressImage(buffer: Buffer): Promise<Buffer> {
        try {
            const metadata = await sharp(buffer).metadata();
            const originalSize = (buffer.length / 1024).toFixed(0);
            
            this.logger.log(`Original image: ${originalSize}KB, ${metadata.width}x${metadata.height}, ${metadata.format}`);

            // Resize and compress
            const compressed = await sharp(buffer)
                .resize(this.MAX_DIMENSION, this.MAX_DIMENSION, {
                    fit: 'inside',
                    withoutEnlargement: true, // Don't upscale small images
                })
                .jpeg({ quality: this.JPEG_QUALITY })
                .toBuffer();

            const compressedSize = (compressed.length / 1024).toFixed(0);
            const savings = ((1 - compressed.length / buffer.length) * 100).toFixed(0);
            
            this.logger.log(`Compressed image: ${compressedSize}KB (saved ${savings}%)`);

            return compressed;
        } catch (err) {
            this.logger.warn(`Image compression failed: ${err.message}, using original`);
            return buffer;
        }
    }

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

            // Compress image for faster processing
            const compressedImage = await this.compressImage(file);

            // Convert to base64 for OpenAI API
            const base64Image = compressedImage.toString('base64');
            const mimeType = 'image/jpeg'; // Always JPEG after compression

            this.logger.log(`Sending to OpenAI: ${(compressedImage.length / 1024).toFixed(0)}KB`);

            const prompt = `You are an expert field ornithologist identifying this bird down to species level, the way you would for a field guide.

Return ONLY JSON in this exact shape:
{
  "visibleFeatures": "What you actually see: size/shape, plumage colors and patterns, facial features (eye color, facial disc shape, ear tufts present/absent, eyebrow/streaking), bill shape and color, leg/foot color and feathering, and any other marks useful for distinguishing similar species",
  "candidateSpecies": ["most likely species", "next most likely, only if genuinely ambiguous"],
  "scientificName": "Genus species" OR "Genus species (Common Breed Name)" for domestic/captive birds,
  "confidence": 0.xx
}

RULES:
1. Identify to the MOST SPECIFIC level possible. Never answer with a family/order-level or generic description (e.g. "owl", "hawk", "brown owl", "duck") — if you can tell it's an owl, you can see enough detail to narrow it down further using field marks like facial disc pattern, eye color, ear tufts, size, and streaking vs. barring.
2. Fill in "visibleFeatures" first and actually use it to reason through what rules similar-looking species in or out, before deciding "scientificName" — do not skip straight to a guess.
3. If multiple species are genuinely difficult to distinguish from this one image (e.g. some flycatchers, juvenile gulls), list your top candidates in "candidateSpecies" ordered by likelihood, but still commit to your single best guess as "scientificName" with a correspondingly lower confidence — never fall back to a vague/generic name just because you're unsure between a few specific species.
4. For domestic/captive breeds (chickens, pigeons, ducks, geese): include the breed name in parentheses after the wild-type scientific name, e.g. "Gallus gallus domesticus (Ayam Cemani)", "Columba livia (Racing Homer)".
5. Confidence: 0.9+ = certain, distinguishing marks clearly visible. 0.7-0.89 = confident with minor ambiguity or partial view. Below 0.7 = genuine uncertainty between specific candidates (still name your best one).`;

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
                // Raised from 300: the prompt now asks for a "visibleFeatures"
                // reasoning field before the species name, which needs more room
                // than a bare {scientificName, confidence} response did.
                max_tokens: 600,
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

            // Log the model's reasoning for debugging accuracy issues later
            // (these fields aren't part of IdentificationResult, just diagnostics)
            const raw = data as unknown as {
                visibleFeatures?: string;
                candidateSpecies?: string[];
            };
            if (raw.visibleFeatures) {
                this.logger.debug(`[ImageAI] Visible features: ${raw.visibleFeatures}`);
            }
            if (raw.candidateSpecies?.length) {
                this.logger.debug(`[ImageAI] Candidates: ${raw.candidateSpecies.join(', ')}`);
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
                const error = err as any;
                this.logger.error(`Image AI identification failed: ${error.message}`, error.stack);
                
                // Handle specific OpenAI errors
                if (error.code === 'invalid_api_key') {
                    throw new Error('Invalid OpenAI API key. Please check your OPENAI_API_KEY in .env file.');
                }
                
                if (error.code === 'insufficient_quota') {
                    throw new Error('OpenAI API quota exceeded. Please check your billing settings.');
                }
                
                if (error.status === 429) {
                    throw new Error('OpenAI API rate limit exceeded. Please try again in a moment.');
                }
                
                if (error.message?.includes('timeout')) {
                    throw new Error('Image analysis timed out. Please try with a smaller image.');
                }
                
                // Re-throw with original message if it's already descriptive
                if (error.message && !error.message.includes('undefined')) {
                    throw new Error(`Image analysis failed: ${error.message}`);
                }
                
                throw new Error('Failed to analyze image. Please ensure the image is clear and contains a bird.');
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
