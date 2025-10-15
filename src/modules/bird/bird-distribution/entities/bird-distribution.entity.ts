import { Entity, Index, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Bird } from '../../birds/entities/bird.entity';

@Entity('bird_distributions')
@Index(['birdId', 'season'])
export class BirdDistribution {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'bird_id' })
    birdId: number;

    @ManyToOne(() => Bird, (bird) => bird.distributions, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'bird_id' })
    bird: Bird;

    @Column({
        type: 'enum',
        enum: ['breeding', 'non-breeding', 'year-round', 'migration'],
    })
    season: string;

    // For mobile, simplified polygon data
    @Column({ type: 'jsonb', nullable: true })
    rangeGeoJson: any; // Store as JSON, render on mobile

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({ type: 'jsonb', nullable: true })
    countries: string[]; // For quick filtering
}
