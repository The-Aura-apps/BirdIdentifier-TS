import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Taxonomy } from './entities/taxonomy.entity';
import { CreateTaxonomyDto } from './dto/create-taxonomy.dto';

@Injectable()
export class TaxonomyService {
    private readonly logger = new Logger(
        TaxonomyService.name,
    );

    constructor(
        @InjectRepository(Taxonomy)
        private readonly taxonomyRepo: Repository<Taxonomy>,
    ) {}

    /**
     * Find or create taxonomy
     */
    async findOrCreate(
        dto: CreateTaxonomyDto,
    ): Promise<Taxonomy> {
        const where = {
            phylum: dto.phylum ?? 'Chordata',
            class: dto.class ?? 'Aves',
            order: dto.order,
            family: dto.family,
            genus: dto.genus,
        };

        let taxonomy = await this.taxonomyRepo.findOne({
            where,
        });

        if (taxonomy) {
            return taxonomy;
        }

        taxonomy = this.taxonomyRepo.create(where);
        taxonomy = await this.taxonomyRepo.save(taxonomy);

        this.logger.log(
            `Created taxonomy: ${taxonomy.order} > ${taxonomy.family} > ${taxonomy.genus}`,
        );

        return taxonomy;
    }

    /**
     * Find taxonomy by classification fields
     */
    async findByClassification(filters: {
        phylum?: string;
        class?: string;
        order?: string;
        family?: string;
        genus?: string;
    }): Promise<Taxonomy | null> {
        const where = {
            phylum: filters.phylum ?? 'Chordata',
            class: filters.class ?? 'Aves',
            order: filters.order,
            family: filters.family,
            genus: filters.genus,
        };

        return this.taxonomyRepo.findOne({
            where,
            relations: ['birds'],
        });
    }

    /**
     * Get all taxonomies with pagination
     */
    async findAll(options: {
        page?: number;
        limit?: number;
    }): Promise<{ data: Taxonomy[]; total: number }> {
        const { page = 1, limit = 20 } = options;

        const [data, total] =
            await this.taxonomyRepo.findAndCount({
                skip: (page - 1) * limit,
                take: limit,
                order: {
                    order: 'ASC',
                    family: 'ASC',
                    genus: 'ASC',
                },
            });

        return { data, total };
    }
}
