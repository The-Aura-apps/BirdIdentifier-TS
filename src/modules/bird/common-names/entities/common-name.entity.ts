import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    Index,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';
import { Bird } from '../../birds/entities/bird.entity';
import { Length } from 'class-validator';

@Index(['bird', 'name', 'language'], {
    unique: true,
})
@Entity('common_names')
export class CommonName {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    @Length(1, 255)
    name: string;

    @Column({
        type: 'varchar',
        length: 10,
        default: 'en',
    })
    @Length(2, 10)
    language: string;

    @Column()
    region: string;

    // @RelationId((commonName: CommonName) => commonName.bird)
    // birdId: number;
    // @Column({ name: 'bird_id' })
    // birdId: number;

    @ManyToOne(() => Bird, bird => bird.commonNames, {
        onDelete: 'CASCADE',
        nullable: false,
    })
    @JoinColumn({
        name: 'bird_id',
    })
    bird: Bird;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
