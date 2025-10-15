import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    Index,
    ManyToMany,
    ManyToOne,
    JoinColumn,
    OneToMany,
} from 'typeorm';
import { Bird } from '../../birds/entities/bird.entity';
import { BirdHabitat } from '../../bird-habitats/entities/bird-habitat.entity';

@Entity('habitats')
export class Habitat {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar', length: 100, unique: true })
    @Index()
    name: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({ type: 'varchar', length: 500, nullable: true })
    iconUrl: string; // Icon for mobile UI

    @ManyToMany(() => Bird, (bird) => bird.habitats)
    birds: Bird[];

    @OneToMany(() => BirdHabitat, (birdHabitats) => birdHabitats.habitat)
    birdHabitats: BirdHabitat[];
}
