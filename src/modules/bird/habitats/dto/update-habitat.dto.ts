import { PartialType } from '@nestjs/mapped-types';
import { CreateHabitatDto } from './create-habitat.dto';

export class UpdateHabitatDto extends PartialType(CreateHabitatDto) {}
