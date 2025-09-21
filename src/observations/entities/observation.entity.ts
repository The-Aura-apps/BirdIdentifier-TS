import { Bird } from "src/birds/entities/bird.entity";
import { Upload } from "src/uploads/entities/upload.entity";
import { Column, CreateDateColumn,UpdateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

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
  status: 'pending' | 'processing' | 'completed' | 'failed' ;

  @ManyToOne(() => Upload, upload => upload.observations, { nullable: false, eager: true })
  upload: Upload;

  @ManyToOne(() => Bird, (bird) => bird.observations, { nullable: true, eager: true })
  bird: Bird;

  @Column({nullable: true})
  result?: string; // AI result

  // @Column()
  // uploadId: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn() 
  updatedAt: Date;
}
