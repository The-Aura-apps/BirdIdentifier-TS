import { ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { Media } from 'src/modules/media/entities/media.entity';
import {
    Entity,
    Index,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    OneToMany,
    ManyToMany,
    JoinTable,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';
import { BirdFood } from '../../bird-foods/entities/bird-food.entity';
import { CommonName } from '../../common-names/entities/common-name.entity';
import { ConservationStatus } from '../../conservation-status/entities/conservation-status.entity';
import { Taxonomy } from '../../taxonomy/entities/taxonomy.entity';
import { BirdDistribution } from '../../bird-distribution/entities/bird-distribution.entity';
import { Habitat } from '../../habitats/entities/habitat.entity';
import { BirdInfo } from 'src/modules/ai/types';
import { Observation } from 'src/modules/observation/observations/entities/observation.entity';
import { Food } from '../../foods/entities/food.entity';

@Entity('birds')
@Index(['scientificName'], { unique: true })
export class Bird {
    @PrimaryGeneratedColumn()
    @ApiProperty()
    id: number;

    @Column({ type: 'varchar', length: 255, unique: true })
    @ApiProperty()
    scientificName: string;

    @Column({ type: 'text', nullable: true })
    @ApiProperty()
    description: string;

    @Column({ type: 'text', nullable: true })
    @ApiProperty()
    behavior: string;

    @Column({ type: 'text', nullable: true })
    @ApiProperty()
    nestingHabits: string;

    @Column({ type: 'text', nullable: true })
    @ApiProperty()
    feedingHabits: string;

    @Column({ type: 'text', nullable: true })
    @ApiProperty()
    eggsDescription: string;

    @Column({ type: 'text', nullable: true })
    @ApiProperty()
    coolFacts: string;

    @Column({ type: 'jsonb', nullable: true })
    @ApiProperty()
    size: {
        lengthCm: { min: number; max: number };
        wingspanCm: { min: number; max: number };
        weightGrams: { min: number; max: number };
    };

    @Column({ type: 'decimal', precision: 4, scale: 1, nullable: true })
    @ApiProperty()
    lifeExpectancyYears: number;

    @Column({ name: 'conservation_status_id', nullable: true })
    conservationStatusId: number;

    @OneToMany(() => Observation, (observation) => observation.bird)
    observations: Observation[];

    @ManyToOne(() => ConservationStatus, { eager: true })
    @JoinColumn({ name: 'conservation_status_id' })
    @ApiProperty()
    conservationStatus: ConservationStatus;

    @OneToMany(() => CommonName, (commonName) => commonName.bird, {
        cascade: true,
    })
    @ApiProperty({ type: () => [CommonName] })
    commonNames: CommonName[];

    @OneToMany(() => Media, (media) => media.bird, { cascade: true })
    @ApiProperty({ type: () => [Media] })
    media: Media[];

    @OneToMany(() => BirdFood, (birdFood) => birdFood.bird, { cascade: true })
    @ApiProperty({ type: () => [BirdFood] })
    birdFoods: BirdFood[];

    @OneToMany(() => BirdDistribution, (distribution) => distribution.bird, {
        cascade: true,
    })
    distributions: BirdDistribution[];

    @OneToMany(() => Taxonomy, (taxonomy) => taxonomy.bird, { cascade: true })
    taxonomy: Taxonomy[];

    @ManyToMany(() => Habitat, (habitat) => habitat.birds)
    @JoinTable({
        name: 'bird_habitats',
        joinColumn: { name: 'bird_id', referencedColumnName: 'id' },
        inverseJoinColumn: { name: 'habitat_id', referencedColumnName: 'id' },
    })
    habitats: Habitat[];

    @CreateDateColumn()
    @Exclude()
    createdAt: Date;

    @UpdateDateColumn()
    @Exclude()
    updatedAt: Date;
}
