import { Observation } from 'src/observations/entities/observation.entity';
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';

@Entity('uploads')
export class Upload {
  @PrimaryGeneratedColumn()
  id: number; 

  @Column()
  fileName: string;

  @Column()
  mimeType: string;

  @Column({ type: 'bytea' }) // store in PostgreSQL for MVP later swich to S3
  fileData: Buffer;

  @Column({ nullable: true })
  checksum: string;

  @OneToMany(() => Observation, (observation) => observation.upload)
  observations: Observation[];
  
  @CreateDateColumn()
  createdAt: Date;
}
