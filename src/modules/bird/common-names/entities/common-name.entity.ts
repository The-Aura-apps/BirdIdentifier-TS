import { Entity, Index, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { Bird } from "../../birds/entities/bird.entity";

@Entity("common_names")
@Index(["birdId", "region"])
export class CommonName {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: "bird_id" })
    birdId: number;

    @ManyToOne(() => Bird, (bird) => bird.commonNames, { onDelete: "CASCADE" })
    @JoinColumn({ name: "bird_id" })
    bird: Bird;

    @Column({ type: "varchar", length: 255 })
    name: string;

    @Column({ type: "varchar", length: 100, nullable: true })
    region: string;

    @Column({ type: "varchar", length: 10, nullable: true })
    languageCode: string; // en, es, fr, etc.
}