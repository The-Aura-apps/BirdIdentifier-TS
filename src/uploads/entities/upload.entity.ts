import { Observation } from 'src/observations/entities/observation.entity';
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { Exclude } from 'class-transformer';

@Entity('uploads')
export class Upload {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  file_name: string;

  @Column()
  mime_type: string;

  @Column()
  type: 'image' | 'audio';

  @Exclude()
  @Column({ type: 'bytea' }) // store in PostgreSQL for MVP later swich tocloude one
  file_data: Buffer;

  @Column({ nullable: true })
  checksum: string;

  @OneToMany(() => Observation, (observation) => observation.upload)
  observations: Observation[];

  @CreateDateColumn()
  createdAt: Date;
}
