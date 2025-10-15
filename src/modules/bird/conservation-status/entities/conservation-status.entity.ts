import { Entity, PrimaryGeneratedColumn, Column, Index, OneToMany } from 'typeorm';
import { Bird } from '../../birds/entities/bird.entity';

@Entity('conservation_status')
export class ConservationStatus {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar', length: 5, unique: true })
    @Index()
    code: string; // LC, NT, VU, EN, CR

    @Column({ type: 'varchar', length: 100 })
    fullName: string;

    @Column({ type: 'varchar', length: 7, nullable: true })
    colorHex: string; // For mobile UI

    @OneToMany(() => Bird, (bird) => bird.conservationStatus)
    birds: Bird[];
}
