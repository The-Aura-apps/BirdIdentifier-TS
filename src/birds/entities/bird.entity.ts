import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('birds')
export class Birds {

  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: false })
  commonName: string;

  @Column({ unique: true })
  scientificName: string;
  
  @Column('jsonb', { unique: true })
  photos: {
    male?: string;
    female?: string;
  };

  @CreateDateColumn()
  createAt: Date;

  @UpdateDateColumn()
  updateAt: Date;
}
