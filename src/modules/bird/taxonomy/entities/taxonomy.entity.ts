import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    OneToMany,
    Index,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';
import { Bird } from '../../birds/entities/bird.entity';

@Entity('taxonomy')
@Index(['phylum', 'class', 'order', 'family', 'genus'], { unique: true })
export class Taxonomy {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar', length: 100, default: 'Chordata' })
    phylum: string;

    @Column({ type: 'varchar', length: 100, default: 'Aves' })
    class: string;

    @Column({ type: 'varchar', length: 100 })
    order: string;

    @Column({ type: 'varchar', length: 100 })
    family: string;

    @Column({ type: 'varchar', length: 100 })
    genus: string;

    @OneToMany(() => Bird, (bird) => bird.taxonomy)
    birds: Bird[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
