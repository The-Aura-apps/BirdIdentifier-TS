import { Module } from '@nestjs/common';
import { CommonNamesController } from './common-names.controller';
import { CommonNamesService } from './common-names.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonName } from './entities/common-name.entity';

@Module({
    imports: [TypeOrmModule.forFeature([CommonName])],
    controllers: [CommonNamesController],
    providers: [CommonNamesService],
    exports: [TypeOrmModule],
})
export class CommonNamesModule {}
