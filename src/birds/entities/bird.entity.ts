import { Observation } from 'src/observations/entities/observation.entity';
import { Column, CreateDateColumn, Entity, Index, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('birds')
export class Bird {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  commonName: string;

  @Column({ unique: true })
  @Index()
  scientificName: string;

  @Column('jsonb', { nullable: true })
  photos?: {
    male?: string;
    female?: string;
  };

  @OneToMany(() => Observation, (observation) => observation.bird)
  observations: Observation[];

  @CreateDateColumn()
  createAt: Date;

  @UpdateDateColumn()
  updateAt: Date;
}
