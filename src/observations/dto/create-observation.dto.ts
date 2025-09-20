import { IsString, IsUUID, IsIn, IsUrl } from 'class-validator';

export class CreateObservationDto {
// can later add   @IsValidDeviceId()  
  @IsString() //or IsUUID if it follow it or costom validator
  deviceId: string;

  @IsUrl()
  uploadId: string; // uploaded file path (will integrate with uploads later)

  @IsIn(['image', 'audio'])
  type: 'image' | 'audio';
}
