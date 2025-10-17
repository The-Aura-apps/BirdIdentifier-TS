import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { Bird } from '../../birds/entities/bird.entity';

@Entity('common_names')
export class CommonName {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column({ type: 'varchar', length: 10, default: 'en' })
    language: string;

    @Column({ name: 'bird_id' })
    birdId: number;

    @ManyToOne(() => Bird, (bird) => bird.commonNames, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'bird_id' })
    bird: Bird;
}
