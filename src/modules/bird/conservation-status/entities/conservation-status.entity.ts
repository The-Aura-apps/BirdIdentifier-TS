import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    Index,
    OneToMany,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Bird } from '../../birds/entities/bird.entity';

/**
 * IUCN Red List Conservation Status codes
 * @see https://www.iucnredlist.org/
 */
export enum ConservationStatusCode {
    EX = 'EX', // Extinct
    EW = 'EW', // Extinct in the Wild
    CR = 'CR', // Critically Endangered
    EN = 'EN', // Endangered
    VU = 'VU', // Vulnerable
    NT = 'NT', // Near Threatened
    LC = 'LC', // Least Concern
    DD = 'DD', // Data Deficient
    NE = 'NE', // Not Evaluated
}

@Entity('conservation_statuses')
@Index(['code'], { unique: true })
export class ConservationStatus {
    @PrimaryGeneratedColumn()
    @ApiProperty({ description: 'Unique identifier' })
    id: number;

    @Column({
        type: 'enum',
        enum: ConservationStatusCode,
        unique: true, 
    })
    @ApiProperty({
        enum: ConservationStatusCode,
        description: 'IUCN conservation status code',
        example: 'LC',
    })
    code: ConservationStatusCode;

    @Column({ type: 'varchar', length: 100 })
    @ApiProperty({
        description: 'Full name of conservation status',
        example: 'Least Concern',
    })
    fullName: string;

    @Column({ type: 'text', nullable: true })
    @ApiProperty({
        description: 'Description of what this status means',
        required: false,
    })
    description?: string;

    @Column({ type: 'int', default: 0 })
    @ApiProperty({
        description: 'Severity ranking (higher = more threatened) 1 to 9',
        example: 0,
    })
    severityLevel: number;

    @Column({ type: 'varchar', length: 50, default: 'IUCN' })
    @ApiProperty({
        description: 'Authority that defined this status',
        example: 'IUCN',
    })
    authority: string;

    @OneToMany(() => Bird, (bird) => bird.conservationStatus)
    birds: Bird[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

  

    /**
     * Default conservation statuses to seed in database
     */
    // DEFAULT_CONSERVATION_STATUSES = [
    //     {
    //         code: ConservationStatusCode.EX,
    //         fullName: 'Extinct',
    //         description: 'No known individuals remaining',
    //         severityLevel: 9,
    //         authority: 'IUCN',
    //     },
    //     {
    //         code: ConservationStatusCode.EW,
    //         fullName: 'Extinct in the Wild',
    //         description: 'Known only to survive in captivity',
    //         severityLevel: 8,
    //         authority: 'IUCN',
    //     },
    //     {
    //         code: ConservationStatusCode.CR,
    //         fullName: 'Critically Endangered',
    //         description: 'Extremely high risk of extinction',
    //         severityLevel: 7,
    //         authority: 'IUCN',
    //     },
    //     {
    //         code: ConservationStatusCode.EN,
    //         fullName: 'Endangered',
    //         description: 'High risk of extinction',
    //         severityLevel: 6,
    //         authority: 'IUCN',
    //     },
    //     {
    //         code: ConservationStatusCode.VU,
    //         fullName: 'Vulnerable',
    //         description: 'High risk of endangerment',
    //         severityLevel: 5,
    //         authority: 'IUCN',
    //     },
    //     {
    //         code: ConservationStatusCode.NT,
    //         fullName: 'Near Threatened',
    //         description: 'Likely to become endangered soon',
    //         severityLevel: 4,
    //         authority: 'IUCN',
    //     },
    //     {
    //         code: ConservationStatusCode.LC,
    //         fullName: 'Least Concern',
    //         description: 'Lowest risk category',
    //         severityLevel: 3,
    //         authority: 'IUCN',
    //     },
    //     {
    //         code: ConservationStatusCode.DD,
    //         fullName: 'Data Deficient',
    //         description: 'Inadequate information to assess',
    //         severityLevel: 2,
    //         authority: 'IUCN',
    //     },
    //     {
    //         code: ConservationStatusCode.NE,
    //         fullName: 'Not Evaluated',
    //         description: 'Not yet evaluated',
    //         severityLevel: 1,
    //         authority: 'IUCN',
    //     },
    // ];
}
