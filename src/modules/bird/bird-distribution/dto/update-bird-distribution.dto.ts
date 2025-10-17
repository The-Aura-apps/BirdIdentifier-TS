import { PartialType } from '@nestjs/mapped-types';
import { CreateBirdDistributionDto } from './create-bird-distribution.dto';

export class UpdateBirdDistributionDto extends PartialType(
    CreateBirdDistributionDto,
) {}
