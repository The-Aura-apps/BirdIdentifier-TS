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

export enum DistributionSeason {
    Breeding = 'breeding',
    NonBreeding = 'non-breeding',
    YearRound = 'year-round',
    Migration = 'migration',
}

@Entity('bird_distributions')
@Index(['birdId', 'season'])
export class BirdDistribution {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({
        name: 'bird_id',
    })
    birdId: number;

    @Column({
        type: 'enum',
        enum: DistributionSeason,
    })
    season: DistributionSeason;

    @Column({
        type: 'text',
        nullable: true,
    })
    description: string;

    @Column({
        type: 'jsonb',
        nullable: true,
    })
    countries: string[]; // For quick filtering

    @ManyToOne(() => Bird, bird => bird.distributions, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({
        name: 'bird_id',
    })
    bird: Bird;

    @CreateDateColumn({
        name: 'created_at',
    })
    createdAt: Date;

    @UpdateDateColumn({
        name: 'updated_at',
    })
    updatedAt: Date;

    // Convert to ProcessedBirdData format
    toProcessedFormat() {
        return {
            season: this.season,
            description: this.description,
            countries: this.countries || [],
        };
    }
}
