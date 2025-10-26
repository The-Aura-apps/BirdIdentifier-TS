import {
    Entity,
    Index,
    PrimaryGeneratedColumn,
    Column,
    OneToMany,
} from 'typeorm';
import { BirdFood } from '../../bird-foods/entities/bird-food.entity';

@Entity('foods')
@Index(['name'])
// @Index(['category'])
export class Food {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar', length: 255, unique: true })
    name: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({ type: 'varchar', length: 500, nullable: true })
    imageStorageKey: string;

    @OneToMany(() => BirdFood, (birdFood) => birdFood.food)
    birdFoods: BirdFood[];

    getImageUrl(): string | null {
        if (!this.imageStorageKey) return null;
        return `${process.env.CDN_URL}/${this.imageStorageKey}`;
    }
}
