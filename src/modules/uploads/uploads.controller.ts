import {
    Controller,
    Post,
    UploadedFile,
    UseInterceptors,
    Get,
    Param,
    Res,
    Body,
    BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiConsumes,
    ApiBody,
    ApiParam,
} from '@nestjs/swagger';
import { UploadsService } from './uploads.service';
import type { Response } from 'express';
import type { FileUploadDto } from './dto/upload.dto';

@ApiTags('Uploads')
@Controller('uploads')
export class UploadsController {
    // Matches AiService.MAX_FILE_SIZE; rejects oversized uploads before they're
    // fully buffered into memory instead of only checking after the fact.
    private static readonly MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

    constructor(private readonly uploadsService: UploadsService) {}

    @Post()
    // Tighter than the global default: each request here triggers a paid
    // OpenAI Vision / BirdNET call.
    @Throttle({ default: { limit: 5, ttl: 60000 } })
    @UseInterceptors(
        FileInterceptor('file', { limits: { fileSize: UploadsController.MAX_UPLOAD_BYTES } }),
    )
    @ApiOperation({
        summary: 'Upload image or audio file for bird identification',
        description:
            'Upload an image or audio file to identify a bird. The system will analyze the file using AI (OpenAI Vision for images, BirdNET for audio) and return bird information with confidence score. Requires deviceId to track user observations.',
    })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        description: 'File upload with metadata',
        schema: {
            type: 'object',
            required: ['file', 'deviceId', 'type'],
            properties: {
                file: {
                    type: 'string',
                    format: 'binary',
                    description: 'Image file (JPEG, PNG) or audio file (MP3, WAV, M4A, FLAC)',
                },
                deviceId: {
                    type: 'string',
                    description: 'Unique device identifier for tracking user observations',
                    example: 'device-123-abc',
                },
                type: {
                    type: 'string',
                    enum: ['image', 'audio'],
                    description: 'Type of file being uploaded',
                    example: 'image',
                },
            },
        },
    })
    @ApiResponse({
        status: 201,
        description: 'File uploaded and bird identified successfully',
        schema: {
            example: {
                success: true,
                bird: {
                    id: 123,
                    scientificName: 'Turdus migratorius',
                    englishName: 'American Robin',
                    description: 'A medium-sized songbird...',
                    diet: 'Omnivore',
                    wingspan: '12-16 inches',
                    length: '9-11 inches',
                    weight: '77g',
                    image: 'https://upload.wikimedia.org/wikipedia/commons/robin.jpg',
                    habitat: [
                        {
                            id: 1,
                            name: 'Forest',
                            description: 'Woodland areas',
                        },
                    ],
                    taxonomy: {
                        kingdom: 'Animalia',
                        phylum: 'Chordata',
                        class: 'Aves',
                        order: 'Passeriformes',
                        family: 'Turdidae',
                        genus: 'Turdus',
                        species: 'migratorius',
                    },
                },
                confidence: 0.92,
                status: 'completed',
                observation: {
                    id: 'uuid-here',
                    createdAt: '2025-12-16T10:30:00.000Z',
                },
            },
        },
    })
    @ApiResponse({
        status: 400,
        description: 'Invalid file type or missing required fields',
        schema: {
            example: {
                statusCode: 400,
                message: 'Invalid file type. Only images and audio files are allowed.',
                error: 'Bad Request',
            },
        },
    })
    @ApiResponse({
        status: 200,
        description: 'Bird identification failed or low confidence',
        schema: {
            example: {
                success: false,
                error: 'Could not identify bird with sufficient confidence',
                confidence: 0.45,
                status: 'failed',
                observation: {
                    id: 'uuid-here',
                    createdAt: '2025-12-16T10:30:00.000Z',
                },
            },
        },
    })
    async uploadFile(
        @UploadedFile() file: FileUploadDto,
        @Body('deviceId') deviceId: string,
        @Body('type') type: 'image' | 'audio',
    ) {
        const result = await this.uploadsService.handleUpload(
            {
                originalname: file.originalname,
                mimetype: file.mimetype,
                buffer: file.buffer,
            },
            deviceId,
            type,
        );

        // Check for errors or low confidence
        if (result.observation.status === 'failed') {
            return {
                success: false,
                error: result.observation.errorMessage || 'Bird identification failed',
                confidence: result.observation.confidence,
                status: result.observation.status,
                observation: {
                    id: result.observation.id,
                    createdAt: result.observation.createdAt,
                },
            };
        }

        // Return bird data on success
        return {
            success: true,
            bird: result.observation.bird,
            confidence: result.observation.confidence,
            status: result.observation.status,
            observation: {
                id: result.observation.id,
                createdAt: result.observation.createdAt,
            },
        };
    }

    @Get(':checksum')
    @ApiOperation({
        summary: 'Download uploaded file by checksum',
        description:
            'Retrieve the original uploaded file (image or audio) by its SHA-256 checksum. Returns the file with appropriate content-type header.',
    })
    @ApiParam({
        name: 'checksum',
        description: 'SHA-256 checksum of the uploaded file',
        type: String,
        example: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b85',
    })
    @ApiResponse({
        status: 200,
        description: 'File retrieved successfully',
        content: {
            'image/jpeg': {
                schema: {
                    type: 'string',
                    format: 'binary',
                },
            },
            'image/png': {
                schema: {
                    type: 'string',
                    format: 'binary',
                },
            },
            'audio/mpeg': {
                schema: {
                    type: 'string',
                    format: 'binary',
                },
            },
            'audio/wav': {
                schema: {
                    type: 'string',
                    format: 'binary',
                },
            },
        },
    })
    @ApiResponse({
        status: 404,
        description: 'File not found',
        schema: {
            example: {
                statusCode: 404,
                message: 'File with checksum ... not found',
                error: 'Not Found',
            },
        },
    })
    async downloadFile(
        @Param('checksum')
        checksum: string,
        @Res()
        res: Response,
    ) {
        const file = await this.uploadsService.getFile(checksum);
        // Strip quotes/CRLF so the stored original filename can't break header
        // parsing or inject extra headers.
        const safeFileName = file.fileName.replace(/["\r\n]/g, '_');
        res.setHeader('Content-Type', file.mimeType);
        res.setHeader('Content-Disposition', `attachment; filename="${safeFileName}"`);
        res.send(file.fileData);
    }

    @Post('identify-and-refresh')
    // Tighter than the global default: this hits OpenAI Vision plus a full
    // iNaturalist/Pexels/OpenAI data refresh on every call.
    @Throttle({ default: { limit: 5, ttl: 60000 } })
    @UseInterceptors(
        FileInterceptor('file', { limits: { fileSize: UploadsController.MAX_UPLOAD_BYTES } }),
    )
    @ApiOperation({
        summary: 'Identify bird and refresh data from APIs',
        description:
            'Upload a bird image to identify the species, then fetch fresh data from all APIs (OpenAI, iNaturalist, Pexels) and update/replace existing data in the database. This ensures you always get the latest bird information, even if the bird already exists.',
    })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        description: 'Image file to identify bird',
        schema: {
            type: 'object',
            required: ['file'],
            properties: {
                file: {
                    type: 'string',
                    format: 'binary',
                    description: 'Bird image (JPEG, PNG)',
                },
            },
        },
    })
    @ApiResponse({
        status: 201,
        description: 'Bird identified and data refreshed successfully',
        schema: {
            example: {
                success: true,
                message: 'Bird identified and data refreshed from APIs',
                bird: {
                    id: 123,
                    scientificName: 'Turdus migratorius',
                    description: 'Fresh data from OpenAI...',
                    commonNames: [{ name: 'American Robin', language: 'en' }],
                    taxonomy: { order: 'Passeriformes', family: 'Turdidae' },
                    habitats: ['Forest', 'Grassland'],
                    media: [
                        { type: 'image', source: 'inaturalist', storageKey: 'https://...' },
                        { type: 'image', source: 'pexels', storageKey: 'https://...' },
                    ],
                },
                confidence: 0.95,
                dataRefreshed: true,
            },
        },
    })
    @ApiResponse({
        status: 400,
        description: 'Invalid file or identification failed',
        schema: {
            example: {
                success: false,
                error: 'Could not identify bird from image',
                confidence: 0.3,
            },
        },
    })
    async identifyAndRefresh(@UploadedFile() file: FileUploadDto) {
        if (!file) {
            throw new BadRequestException('No file uploaded');
        }

        const result = await this.uploadsService.identifyAndRefreshBird({
            originalname: file.originalname,
            mimetype: file.mimetype,
            buffer: file.buffer,
        });

        return result;
    }
}
