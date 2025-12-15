import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('device_settings')
export class DeviceSettings {
  @PrimaryGeneratedColumn()
  @ApiProperty({ description: 'Unique identifier for the device settings' })
  id: number;

  @Column({ unique: true })
  @ApiProperty({
    description: 'Unique device identifier',
    example: 'abc123-device-uuid',
  })
  deviceId: string;

  @Column({
    type: 'enum',
    enum: ['photo', 'sound', 'photo_sound'],
  })
  @ApiProperty({
    description: 'Preferred bird identification method',
    enum: ['photo', 'sound', 'photo_sound'],
    example: 'photo_sound',
  })
  identificationMethod: 'photo' | 'sound' | 'photo_sound';

  @Column({
    type: 'enum',
    enum: ['for_fun', 'hunting', 'keeping_birds', 'just_interested'],
  })
  @ApiProperty({
    description: 'User purpose for using the app',
    enum: ['for_fun', 'hunting', 'keeping_birds', 'just_interested'],
    example: 'for_fun',
  })
  userPurpose: 'for_fun' | 'hunting' | 'keeping_birds' | 'just_interested';

  @CreateDateColumn()
  @ApiProperty({ description: 'Timestamp when settings were created' })
  createdAt: Date;

  @UpdateDateColumn()
  @ApiProperty({ description: 'Timestamp when settings were last updated' })
  updatedAt: Date;
}
