import { PartialType } from '@nestjs/mapped-types';
import { CreateCommonNameDto } from './create-common-name.dto';

export class UpdateCommonNameDto extends PartialType(
    CreateCommonNameDto,
) {}
