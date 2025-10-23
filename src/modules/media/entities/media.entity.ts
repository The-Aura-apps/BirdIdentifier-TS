import { Bird } from 'src/modules/bird/birds/entities/bird.entity';
import {
    Entity,
    Index,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';

export enum mediaType {
    Photo = 'photo',
    Audio = 'audio',
    Video = 'video',
}

@Entity('media')
@Index(['birdId', 'type'])
@Index(['birdId', 'orderIndex'])
export class Media {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'bird_id' })
    birdId: number;

    @ManyToOne(() => Bird, (bird) => bird.media, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'bird_id' })
    bird: Bird;

    @Column({ type: 'varchar', length: 500 })
    storageKey: string; // S3 key: birds/123/photos/uuid.jpg

    @Column({ type: 'enum', enum: mediaType, default: mediaType.Photo })
    type: mediaType;

    @Column({ type: 'varchar', nullable: true })
    size: string; // File size as string (e.g., "2.5 MB")

    @Column({ type: 'varchar', length: 255, nullable: true })
    caption: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    source: string; // Source/credit for the media

    @Column({ type: 'varchar', length: 255, nullable: true })
    attribution: string; // Attribution text

    @Column({ type: 'integer', default: 0 })
    orderIndex: number; // For sorting media items

    @Column({ type: 'jsonb', nullable: true })
    metadata: {
        width?: number; // Image/video width in pixels
        height?: number; // Image/video height in pixels
        duration?: number; // Duration in seconds for video/audio
        fileSize?: number; // File size in bytes
        mimeType?: string; // e.g., 'image/jpeg', 'audio/mp3', 'video/mp4'
        format?: string; // File format (e.g., 'jpeg', 'png', 'mp3')
        bitrate?: number; // For audio/video
        sampleRate?: number; // For audio
        thumbnailKey?: string; // S3 key for video thumbnail
    };

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    // Helper methods for URL generation
    getCdnUrl(variant?: string): string {
        const base = process.env.CDN_URL ?? '';
        const key = variant ? `${variant}/${this.storageKey}` : this.storageKey;
        return `${base}/${key}`;
    }

    getDisplayUrl(): string {
        // Returns the most appropriate URL for display
        return this.getCdnUrl();
    }

    getThumbnailUrl(): string {
        // For videos, return thumbnail; for images, return thumbnail variant
        if (this.type === mediaType.Video && this.metadata?.thumbnailKey) {
            return `${process.env.CDN_URL}/${this.metadata.thumbnailKey}`;
        }
        return this.getCdnUrl('thumbnail');
    }

    // Convert to ProcessedBirdData media format
    toProcessedFormat() {
        return {
            type: this.type,
            storageKey: this.storageKey,
            size: this.size,
            caption: this.caption,
            source: this.source,
            attribution: this.attribution,
            orderIndex: this.orderIndex,
            metadata: this.metadata,
        };
    }
}
