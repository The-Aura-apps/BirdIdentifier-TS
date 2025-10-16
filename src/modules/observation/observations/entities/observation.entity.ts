import { Bird } from 'src/modules/bird/birds/entities/bird.entity';
import { Upload } from 'src/modules/uploads/entities/upload.entity';
import {
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    Index,
} from 'typeorm';
import { BirdAiResponse } from 'src/modules/ai/types';

export enum ObservationStatus {
    PENDING = 'pending',
    PROCESSING = 'processing',
    COMPLETED = 'completed',
    FAILED = 'failed',
}

@Index(['deviceId', 'createdAt']) // For device history queries
@Index(['status']) // For filtering by status
@Entity('observations')
export class Observation {
    @PrimaryGeneratedColumn('uuid')
    id: string; // UUID

    @Column()
    deviceId: string;

    @Column({ type: 'varchar', length: 10 })
    type: 'image' | 'audio';

    @Column({
        type: 'enum',
        enum: ObservationStatus,
        default: ObservationStatus.PENDING,
    })
    status: ObservationStatus;

    @Column({ name: 'upload_id' })
    uploadId: number;

    @ManyToOne(() => Upload, (upload) => upload.observations, {
        nullable: false,
        eager: true, // Eager load upload for processing
    })
    @JoinColumn({ name: 'upload_id' })
    upload: Upload;

    // Foreign key for Bird (nullable because might not be identified)
    @Column({ name: 'bird_id', nullable: true })
    birdId: number | null;

    @ManyToOne(() => Bird, (bird) => bird.observations, {
        nullable: true,
        eager: true, // Eager load bird for API responses
    })
    @JoinColumn({ name: 'bird_id' })
    bird: Bird | null;

    @Column({ type: 'jsonb', nullable: true })
    aiResult: BirdAiResponse | null;

    @Column({ type: 'decimal', precision: 5, scale: 4, nullable: true })
    confidence: number | null;

    @Column({ type: 'text', nullable: true })
    errorMessage: string | null;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    // Helper methods
    isProcessable(): boolean {
        return this.status === ObservationStatus.PENDING;
    }

    markAsProcessing(): void {
        this.status = ObservationStatus.PROCESSING;
        this.updatedAt = new Date();
    }

    markAsCompleted(bird: Bird, aiResponse: BirdAiResponse): void {
        this.status = ObservationStatus.COMPLETED;
        this.bird = bird;
        this.birdId = bird.id;
        this.aiResult = aiResponse;
        this.confidence = aiResponse.confidence;
        this.errorMessage = null;
        this.updatedAt = new Date();
    }

    markAsFailed(error: string, aiResponse?: BirdAiResponse): void {
        this.status = ObservationStatus.FAILED;
        this.errorMessage = error;
        this.aiResult = aiResponse || null;
        this.bird = null;
        this.birdId = null;
        this.confidence = aiResponse?.confidence ?? null;
        this.updatedAt = new Date();
    }
}
