import { Observation } from 'src/modules/observation/observations/entities/observation.entity';
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    OneToMany,
    Index,
} from 'typeorm';
import { Exclude } from 'class-transformer';

@Entity('uploads')
export class Upload {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({
        name: 'file_name',
    })
    fileName: string; // Use camelCase for consistency

    @Column({
        name: 'mime_type',
    })
    mimeType: string; // Use camelCase for consistency

    @Column({
        type: 'varchar',
        length: 10,
    })
    type: 'image' | 'audio';

    @Exclude()
    @Column({
        type: 'bytea',
        name: 'file_data',
    }) // Keep database column as file_data
    fileData: Buffer; // Use camelCase in TypeScript

    @Index()
    @Column({
        unique: true,
        nullable: false,
    })
    checksum: string;

    @OneToMany(() => Observation, observation => observation.upload)
    observations: Observation[];

    @CreateDateColumn()
    createdAt: Date;

    // Helper method to get file info for API responses
    getFileInfo() {
        return {
            id: this.id,
            fileName: this.fileName,
            mimeType: this.mimeType,
            type: this.type,
            checksum: this.checksum,
            createdAt: this.createdAt,
        };
    }
}
