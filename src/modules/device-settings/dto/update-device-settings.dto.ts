import { PartialType } from '@nestjs/swagger';
import { CreateDeviceSettingsDto } from './create-device-settings.dto';
import { IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateDeviceSettingsDto extends PartialType(
  CreateDeviceSettingsDto,
) {
  @IsEnum(['photo', 'sound', 'photo_sound'])
  @IsOptional()
  @ApiProperty({
    description: 'Preferred bird identification method',
    enum: ['photo', 'sound', 'photo_sound'],
    example: 'photo_sound',
    required: false,
  })
  identificationMethod?: 'photo' | 'sound' | 'photo_sound';

  @IsEnum(['for_fun', 'hunting', 'keeping_birds', 'just_interested'])
  @IsOptional()
  @ApiProperty({
    description: 'User purpose for using the app',
    enum: ['for_fun', 'hunting', 'keeping_birds', 'just_interested'],
    example: 'for_fun',
    required: false,
  })
  userPurpose?: 'for_fun' | 'hunting' | 'keeping_birds' | 'just_interested';
}
