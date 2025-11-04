import {
    IsString,
    IsUUID,
    IsIn,
    IsUrl,
    IsNumber,
} from 'class-validator';

export class CreateObservationDto {
    // can later add   @IsValidDeviceId()
    @IsString() //or IsUUID if it follow it or costom validator
    deviceId: string;

    @IsNumber()
    uploadId: number; // FK column, Stored directly as a number in your Observation table.

    @IsIn(['image', 'audio'])
    type: 'image' | 'audio';
}
