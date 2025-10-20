import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { Bird } from '../../birds/entities/bird.entity';

@Entity('taxonomy')
export class Taxonomy {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'bird_id', unique: true })
    birdId: number;

    @ManyToOne(() => Bird, (bird) => bird.taxonomy, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'bird_id' })
    bird: Bird;

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
}
