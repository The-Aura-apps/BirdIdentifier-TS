import {
    Entity,
    Index,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';
import { Bird } from '../../birds/entities/bird.entity';
import { Food } from '../../foods/entities/food.entity';

@Entity('bird_foods')
@Index(['bird', 'food'], { unique: true })
export class BirdFood {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Bird, (bird) => bird.birdFoods, {
        onDelete: 'CASCADE',
        nullable: false,
    })
    @JoinColumn({ name: 'bird_id' })
    bird: Bird;

    @ManyToOne(() => Food, (food) => food.birdFoods, {
        onDelete: 'CASCADE',
        nullable: false,
    })
    @JoinColumn({ name: 'food_id' })
    food: Food;

    @Column({ type: 'boolean', default: true })
    isActive: boolean;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
