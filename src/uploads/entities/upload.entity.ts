import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('uploads')
export class Upload {
  @PrimaryGeneratedColumn()
  id: number; // witch 

  @Column()
  fileName: string;

  @Column()
  mimeType: string;

  @Column({ type: 'bytea' })
  fileData: Buffer;

  @Column({nullable: true})
  checksum: string;

  @CreateDateColumn()
  createdAt: Date;
}
