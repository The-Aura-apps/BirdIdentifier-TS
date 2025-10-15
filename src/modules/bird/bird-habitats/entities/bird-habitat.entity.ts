import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Bird } from '../../birds/entities/bird.entity';
import { Habitat } from '../../habitats/entities/habitat.entity';

@Entity('bird_habitats')
export class BirdHabitat {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Bird, (bird) => bird.birdHabitats, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'bird_id' })
    bird: Bird;

    @ManyToOne(() => Habitat, (habitat) => habitat.birdHabitats, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'habitat_id' })
    habitat: Habitat;
}
