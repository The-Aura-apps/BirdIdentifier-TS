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

@Entity('habitats')
export class Habitat {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({
        type: 'varchar',
        length: 100,
        unique: true,
    })
    @Index()
    name: string;

    @Column({
        type: 'text',
        nullable: true,
    })
    description: string;
    
    @ManyToMany(() => Bird, (bird) => bird.habitats)
    birds: Bird[];
}
