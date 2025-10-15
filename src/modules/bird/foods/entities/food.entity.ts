import { Entity, Index, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { BirdFood } from '../../bird-foods/entities/bird-food.entity';

@Entity('foods')
@Index(['name'])
@Index(['category'])
export class Food {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar', length: 255, unique: true })
    name: string;

    @Column({ type: 'varchar', length: 50 })
    category: string; // insect, seed, fruit, fish, nectar, etc.

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({ type: 'varchar', length: 500, nullable: true })
    imageStorageKey: string;

    @Column({ type: 'jsonb', nullable: true })
    imageVariants: {
        thumbnail?: string;
        display?: string;
    };

    @Column({ type: 'varchar', length: 255, nullable: true })
    imageAttribution: string;

    @Column({ type: 'jsonb', nullable: true })
    nutritionalInfo: {
        protein?: number;
        fat?: number;
        carbs?: number;
    };

    @OneToMany(() => BirdFood, (birdFood) => birdFood.food)
    birdFoods: BirdFood[];

    getImageUrl(variant: 'thumbnail' | 'display' = 'thumbnail'): string | null {
        if (!this.imageStorageKey && !this.imageVariants) return null;
        const key = this.imageVariants?.[variant] || this.imageStorageKey;
        return key ? `${process.env.CDN_URL}/${key}` : null;
    }
}
