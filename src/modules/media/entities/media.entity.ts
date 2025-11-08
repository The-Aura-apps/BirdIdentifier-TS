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

export enum MediaType {
    Photo = 'photo',
    Audio = 'audio',
    Video = 'video',
}

@Entity('media')
@Index(['type'])
@Index(['orderIndex'])
export class Media {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Bird, (bird) => bird.media, {
        onDelete: 'CASCADE',
        nullable: false,
    })
    @JoinColumn({ name: 'bird_id' })
    bird: Bird;

    @Column({ type: 'varchar', length: 500 })
    storageKey: string; // e.g., "birds/passer-domesticus/photo1.jpg"

    @Column({
        type: 'enum',
        enum: MediaType,
        default: MediaType.Photo,
    })
    type: MediaType;

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
        width?: number;
        height?: number;
        duration?: number;
        fileSize?: number;
        mimeType?: string;
        format?: string;
        bitrate?: number;
        sampleRate?: number;
        thumbnailKey?: string;
    };

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    // Helper method for local storage URL
    getLocalUrl(): string {
        // For local development
        const base = process.env.LOCAL_STORAGE_URL || 'http://localhost:3000/uploads';
        return `${base}/${this.storageKey}`;
    }

    // Helper method for cloud storage URL (future)
    getCloudUrl(): string {
        const base = process.env.CDN_URL || process.env.CLOUD_STORAGE_URL;
        if (!base) return this.getLocalUrl();
        return `${base}/${this.storageKey}`;
    }

    // Get appropriate URL based on environment
    getDisplayUrl(): string {
        return process.env.USE_CLOUD_STORAGE === 'true' ? this.getCloudUrl() : this.getLocalUrl();
    }

    getThumbnailUrl(): string {
        if (this.type === MediaType.Video && this.metadata?.thumbnailKey) {
            const base =
                process.env.USE_CLOUD_STORAGE === 'true'
                    ? process.env.CDN_URL || process.env.CLOUD_STORAGE_URL
                    : process.env.LOCAL_STORAGE_URL || 'http://localhost:3000/uploads';
            return `${base}/${this.metadata.thumbnailKey}`;
        }
        return this.getDisplayUrl();
    }
}
