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
import { BirdHabitat } from '../../bird-habitats/entities/bird-habitat.entity';
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

    @Column({ type: 'varchar', length: 255, nullable: true })
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

    @OneToMany(() => BirdHabitat, (birdHabitat) => birdHabitat.bird)
    birdHabitats: BirdHabitat[];

    @CreateDateColumn()
    @Exclude()
    createdAt: Date;

    @UpdateDateColumn()
    @Exclude()
    updatedAt: Date;

    // Helper method to get active foods
    getActiveFoods(): Food[] {
        if (!this.birdFoods) return [];
        return this.birdFoods
            .filter((bf) => bf.isActive)
            .map((bf) => bf.food)
            .filter((food): food is Food => food !== undefined);
    }

    // Virtual field for mobile API
    // @Expose()
    // get primaryImage(): string | null {
    //     const photo = this.media?.find((m) => m.mediaType === 'photo');
    //     return photo ? photo.getThumbnailUrl() : null;
    // }

    // // Helper to get primary common name
    // get primaryCommonName(): string {
    //     return this.commonNames?.[0]?.name || 'Unknown';
    // }

    toBirdInfo(): BirdInfo {
        return {
            scientificName: this.scientificName,
            description: this.description,
            behavior: this.behavior,
            nestingHabits: this.nestingHabits,
            feedingHabits: this.feedingHabits,
            eggsDescription: this.eggsDescription,
            coolFacts: this.coolFacts ? [this.coolFacts] : [],
            size: this.size,
            lifeExpectancyYears: this.lifeExpectancyYears,
            conservationStatus: this.conservationStatus,
            commonNames: this.commonNames,
            media: this.media,
            habitats: this.habitats,
            taxonomy: this.taxonomy?.[0], // Assuming one taxonomy per bird
            distributions: this.distributions,
            birdFoods: this.birdFoods,
        };
    }
}
