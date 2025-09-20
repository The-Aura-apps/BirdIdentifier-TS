import { Upload } from "src/uploads/entities/upload.entity";
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Observation {
  createObservation(arg0: { id: `${string}-${string}-${string}-${string}-${string}`; filePath: string; type: string; status: string; createdAt: Date; }) {
    throw new Error('Method not implemented.');
  }
  @PrimaryGeneratedColumn('uuid')
  id: string; // UUID

  @Column()
  deviceId: string;

  @Column()
  fileUrl: string;

  @Column()
  type: 'image' | 'audio';
  
  @Column({ default: 'pending' })
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'pending_identification';

  @ManyToOne(() => Upload)
  @JoinColumn({ name: 'upload_id' })
  upload: Upload;
  
  @Column({nullable: true})
  result?: string; // AI result

  @CreateDateColumn()
  createdAt: Date;

  @CreateDateColumn()
  updatedAt: Date;
}
