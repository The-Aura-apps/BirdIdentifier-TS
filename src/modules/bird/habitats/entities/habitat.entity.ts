import { Entity, PrimaryGeneratedColumn, Column, Index, ManyToMany, ManyToOne, JoinColumn } from "typeorm";
import { Bird } from "../../birds/entities/bird.entity";

@Entity("habitats")
export class Habitat {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: "varchar", length: 100, unique: true })
    @Index()
    name: string;

    @Column({ type: "text", nullable: true })
    description: string;

    @Column({ type: "varchar", length: 500, nullable: true })
    iconUrl: string; // Icon for mobile UI

    @ManyToMany(() => Bird, (bird) => bird.habitats)
    birds: Bird[];
}

@Entity("bird_distributions")
@Index(["birdId", "season"])
export class BirdDistribution {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: "bird_id" })
    birdId: number;

    @ManyToOne(() => Bird, (bird) => bird.distributions, {
        onDelete: "CASCADE",
    })
    @JoinColumn({ name: "bird_id" })
    bird: Bird;

    @Column({
        type: "enum",
        enum: ["breeding", "non-breeding", "year-round", "migration"],
    })
    season: string;

    // For mobile, simplified polygon data
    @Column({ type: "jsonb", nullable: true })
    rangeGeoJson: any; // Store as JSON, render on mobile

    @Column({ type: "text", nullable: true })
    description: string;

    @Column({ type: "jsonb", nullable: true })
    countries: string[]; // For quick filtering
}
