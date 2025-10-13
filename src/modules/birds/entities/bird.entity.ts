import { Observation } from "src/modules/observations/entities/observation.entity";
import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from "typeorm";

@Entity("birds")
export class Bird {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Index()
    @Column({ unique: true })
    scientificName: string;

    @Column({ nullable: true }) // Check in test
    commonName: string;

    @Column("jsonb", { nullable: true })
    photos?: {
        male?: string;
        female?: string;
    };

    @Column("jsonb", { nullable: true })
    features?: {
        sizeAndShape?: string;
        colorPattern?: string;
        billShape?: string;
        markings?: string;
    };

    @Column("jsonb", { nullable: true })
    ecology?: {
        habitat?: string;
        behavior?: string;
        diet?: string;
    };

    @Column("jsonb", { nullable: true })
    geography?: {
        rangeMap?: string;
        yearRound?: string;
        breeding?: string;
        wintering?: string;
        migration?: string;
        seasonality?: string;
    };

    @Column("jsonb", { nullable: true })
    education?: {
        conservation?: string;
        nesting?: string;
        eggs?: string;
        coolFacts?: string[];
    };

    @OneToMany(() => Observation, (observation) => observation.bird)
    observations: Observation[];

    @CreateDateColumn()
    createAt: Date;

    @UpdateDateColumn()
    updateAt: Date;
}
