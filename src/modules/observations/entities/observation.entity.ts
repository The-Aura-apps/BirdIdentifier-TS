import { Bird } from "src/modules/birds/entities/bird.entity";
import { Upload } from "src/modules/uploads/entities/upload.entity";
import {
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    Index,
} from "typeorm";
import type { BirdAiResponse } from "src/modules/ai/types";

export enum ObservationStatus {
    PENDING = 'pending',
    PROCESSING = 'processing',
    COMPLETED = 'completed',
    FAILED = 'failed',
}

@Index(['deviceId', 'createdAt']) // For device history queries
@Index(['status']) // For filtering by status
@Entity()
export class Observation {
    @PrimaryGeneratedColumn('uuid')
    id: string; // UUID

    @Column()
    deviceId: string;

    // @Column()
    // fileUrl: string;

    @Column({ type: 'varchar', length: 10 })
    type: "image" | 'audio';

    @Column({
        type: "varchar",
        default: ObservationStatus.PENDING,
    })
    status: ObservationStatus;

    @Column()
    uploadId: number; // Add this for better queries

    @ManyToOne(() => Upload, (upload) => upload.observations, {
        nullable: false,
        eager: false,
    })
    @JoinColumn({ name: "uploadId" }) // Explicit mapping
    upload: Upload;

    @ManyToOne(() => Bird, (bird) => bird.observations, {
        nullable: true,
        eager: true,
    })
    bird: Bird | null;

    @Column({ type: "jsonb", nullable: true }) // check nulleble
    result: BirdAiResponse | null; // AI result

    // @Column()
    // uploadId: number;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
