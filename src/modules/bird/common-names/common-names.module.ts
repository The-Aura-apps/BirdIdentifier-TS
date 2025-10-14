import { Module } from '@nestjs/common';
import { CommonNamesController } from './common-names.controller';
import { CommonNamesService } from './common-names.service';

@Module({
  controllers: [CommonNamesController],
  providers: [CommonNamesService]
})
export class CommonNamesModule {}
