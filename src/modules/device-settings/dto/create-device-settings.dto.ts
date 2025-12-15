import { IsString, IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateDeviceSettingsDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Unique device identifier',
    example: 'abc123-device-uuid',
  })
  deviceId: string;

  @IsEnum(['photo', 'sound', 'photo_sound'])
  @IsNotEmpty()
  @ApiProperty({
    description: 'Preferred bird identification method',
    enum: ['photo', 'sound', 'photo_sound'],
    example: 'photo_sound',
  })
  identificationMethod: 'photo' | 'sound' | 'photo_sound';

  @IsEnum(['for_fun', 'hunting', 'keeping_birds', 'just_interested'])
  @IsNotEmpty()
  @ApiProperty({
    description: 'User purpose for using the app',
    enum: ['for_fun', 'hunting', 'keeping_birds', 'just_interested'],
    example: 'for_fun',
  })
  userPurpose: 'for_fun' | 'hunting' | 'keeping_birds' | 'just_interested';
}
