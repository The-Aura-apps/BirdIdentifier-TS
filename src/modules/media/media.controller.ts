import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Put,
    Delete,
    HttpCode,
    HttpStatus,
    Query,
    Patch,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';
import { MediaService } from './media.service';
import { Media } from './entities/media.entity';
import { CreateMediaDto } from './dto/create-media.dto';
import { UpdateMediaDto } from './dto/update-media.dto';

@ApiTags('media')
@Controller('media')
export class MediaController {
    constructor(private readonly mediaService: MediaService) {}

    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Create media item' })
    create(@Body() createDto: CreateMediaDto): Promise<Media> {
        return this.mediaService.create(createDto);
    }

    @Get()
    @ApiOperation({ summary: 'Get all media with pagination' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    findAll(
        @Query('page') page = '1',
        @Query('limit') limit = '20',
    ): Promise<{ data: Media[]; total: number }> {
        return this.mediaService.findAll({
            page: Number(page),
            limit: Number(limit),
        });
    }

    @Get('bird/:birdId')
    @ApiOperation({ summary: 'Get all media for a bird' })
    @ApiParam({ name: 'birdId', description: 'Bird ID' })
    findByBirdId(@Param('birdId') birdId: string): Promise<Media[]> {
        return this.mediaService.findByBirdId(+birdId);
    }

    @Get('bird/:birdId/type/:type')
    @ApiOperation({ summary: 'Get media by bird and type' })
    @ApiParam({ name: 'birdId', description: 'Bird ID' })
    @ApiParam({ name: 'type', description: 'Media type (photo/audio/video)' })
    findByType(@Param('birdId') birdId: string, @Param('type') type: string): Promise<Media[]> {
        return this.mediaService.findByType(+birdId, type);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get media by ID' })
    @ApiParam({ name: 'id', description: 'Media ID' })
    findOne(@Param('id') id: string): Promise<Media> {
        return this.mediaService.findOne(+id);
    }

    @Put(':id')
    @ApiOperation({ summary: 'Update media' })
    @ApiParam({ name: 'id', description: 'Media ID' })
    update(@Param('id') id: string, @Body() updateDto: UpdateMediaDto): Promise<Media> {
        return this.mediaService.update(+id, updateDto);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Delete media' })
    @ApiParam({ name: 'id', description: 'Media ID' })
    remove(@Param('id') id: string): Promise<void> {
        return this.mediaService.remove(+id);
    }

    @Patch('bird/:birdId/reorder')
    @ApiOperation({ summary: 'Reorder media items for a bird' })
    @ApiParam({ name: 'birdId', description: 'Bird ID' })
    reorder(
        @Param('birdId') birdId: string,
        @Body() body: { mediaIds: number[] },
    ): Promise<Media[]> {
        return this.mediaService.reorder(+birdId, body.mediaIds);
    }
}
