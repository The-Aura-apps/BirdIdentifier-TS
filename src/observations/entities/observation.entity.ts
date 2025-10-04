import { Bird } from "src/birds/entities/bird.entity";
import { Upload } from "src/uploads/entities/upload.entity";
import { Column, CreateDateColumn,UpdateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import type { BirdAiResponse } from 'src/ai/types';

@Entity()
export class Observation {
  @PrimaryGeneratedColumn('uuid')
  id: string; // UUID

  @Column()
  deviceId: string;

  // @Column()
  // fileUrl: string;

  @Column()
  type: 'image' | 'audio';

  @Column({ default: 'pending' })
  status: 'pending' | 'processing' | 'completed' | 'failed';

  @ManyToOne(() => Upload, (upload) => upload.observations, {
    nullable: false,
    eager: true,
  })
  upload: Upload;

  @ManyToOne(() => Bird, (bird) => bird.observations, {
    nullable: false,
    eager: true,
  })
  bird: Bird | null;

  @Column({ type: 'jsonb', nullable: true }) // check nulleble
  result: BirdAiResponse | null; // AI result

  // @Column()
  // uploadId: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
