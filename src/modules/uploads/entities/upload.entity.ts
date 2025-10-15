import { Observation } from 'src/modules/observation/observations/entities/observation.entity';
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    OneToMany,
    Index,
} from 'typeorm';
import { Exclude } from 'class-transformer';

@Entity('uploads')
export class Upload {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    file_name: string;

    @Column()
    mime_type: string;

    @Column({ type: 'varchar', length: 10 })
    type: 'image' | 'audio';
    /*
  // CHANGE: Store URL instead of buffer
  @Column({ nullable: true })
  storage_url: string; // S3/CloudFlare R2/GCS URL

  @Column({ nullable: true })
  storage_key: string; // The key/path in cloud storage

    // Keep for backward compatibility during migration
  @Column({ type: 'bytea', nullable: true })
  file_data: Buffer;

    @Column({ type: 'bigint', nullable: true })
  file_size: number; // Track size for monitoring
  */

    @Exclude()
    @Column({ type: 'bytea' }) // store in PostgreSQL for MVP later swich tocloude one
    file_data: Buffer;

    @Index() // Add index for faster duplicate detection
    @Column({ unique: true, nullable: false })
    checksum: string;

    @OneToMany(() => Observation, (observation) => observation.upload)
    observations: Observation[];

    @CreateDateColumn()
    createdAt: Date;
}
