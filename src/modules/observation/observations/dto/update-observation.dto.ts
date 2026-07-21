import { IsEnum, IsOptional } from 'class-validator';
import { ObservationStatus } from '../entities/observation.entity';

export class UpdateObservationDto {
    @IsOptional()
    @IsEnum(ObservationStatus)
    status?: ObservationStatus;
}
