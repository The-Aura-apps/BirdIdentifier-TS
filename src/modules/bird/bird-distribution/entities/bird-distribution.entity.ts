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
import { IsEnum } from 'class-validator';

export enum DistributionSeason {
    Breeding = 'breeding',
    NonBreeding = 'non-breeding',
    YearRound = 'year-round',
    Migration = 'migration',
}

@Entity('bird_distributions')
@Index(['location'])
export class BirdDistribution {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'month', type: 'int' })
    month: number; // 1 = Jan, 12 = Dec

    @IsEnum(DistributionSeason)
    season: DistributionSeason;

    @Column({
        type: 'jsonb',
        nullable: true,
    })
    location: {
        country?: string;
        region?: string;
        coordinates?: { lat: number; lng: number };
    };

    @Column({
        type: 'float',
        nullable: true,
    })
    presenceScore?: number; // e.g., 0–1 scale of likelihood

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

    @ManyToOne(() => Bird, (bird) => bird.distributions, {
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
}
