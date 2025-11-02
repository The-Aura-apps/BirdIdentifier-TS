import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaxonomyController } from './taxonomy.controller';
import { TaxonomyService } from './taxonomy.service';
import { Taxonomy } from './entities/taxonomy.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Taxonomy])],
    controllers: [TaxonomyController],
    providers: [TaxonomyService],
    exports: [TaxonomyService, TypeOrmModule], // Export for use in other modules
})
export class TaxonomyModule {}
