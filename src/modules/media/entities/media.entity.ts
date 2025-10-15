import { Bird } from 'src/modules/bird/birds/entities/bird.entity';
import { Entity, Index, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';

@Entity('media')
@Index(['birdId', 'mediaType'])
export class Media {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'bird_id' })
    birdId: number;

    @ManyToOne(() => Bird, (bird) => bird.media, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'bird_id' })
    bird: Bird;

    @Column({
        type: 'enum',
        enum: ['photo', 'sound', 'video'],
        default: 'photo',
    })
    mediaType: string;

    @Column({ type: 'varchar', length: 500 })
    storageKey: string; // S3 key: birds/123/photos/uuid.jpg

    @Column({ type: 'jsonb', nullable: true })
    variants: {
        thumbnail?: string; // 150x150
        small?: string; // 400x400
        medium?: string; // 800x800
        large?: string; // 1920x1920
        original: string;
    };

    @Column({ type: 'varchar', length: 255, nullable: true })
    caption: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    attribution: string;

    @Column({ type: 'integer', default: 0 })
    orderIndex: number; // For sorting

    @Column({ type: 'jsonb', nullable: true })
    metadata: {
        width?: number;
        height?: number;
        duration?: number; // For video/audio
        fileSize?: number;
        mimeType?: string;
    };

    // Helper methods for mobile
    getThumbnailUrl(): string {
        const key = this.variants?.thumbnail || this.variants?.small || this.storageKey;
        return `${process.env.CDN_URL}/${key}`;
    }

    getDisplayUrl(): string {
        const key = this.variants?.medium || this.variants?.large || this.storageKey;
        return `${process.env.CDN_URL}/${key}`;
    }
}
