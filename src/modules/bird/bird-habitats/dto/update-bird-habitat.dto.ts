import { PartialType } from '@nestjs/mapped-types';
import { CreateBirdHabitatDto } from './create-bird-habitat.dto';

export class UpdateBirdHabitatDto extends PartialType(CreateBirdHabitatDto) {}
