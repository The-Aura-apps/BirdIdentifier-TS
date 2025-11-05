import { Controller, Get, Post, Query, Body } from '@nestjs/common';
import { TaxonomyService } from './taxonomy.service';
import { CreateTaxonomyDto } from './dto/create-taxonomy.dto';

@Controller('taxonomy')
export class TaxonomyController {
    constructor(private readonly taxonomyService: TaxonomyService) {}

    /**
     * POST /taxonomy
     * Find or create taxonomy
     */
    @Post()
    async createOrFind(
        @Body()
        dto: CreateTaxonomyDto
    ) {
        return this.taxonomyService.findOrCreate(dto);
    }

    /**
     * GET /taxonomy/find
     * Find taxonomy by classification
     * Example: /taxonomy/find?order=Passeriformes&family=Corvidae&genus=Corvus
     */
    @Get('find')
    async findByClassification(
        @Query('phylum')
        phylum?: string,
        @Query('class')
        className?: string,
        @Query('order')
        order?: string,
        @Query('family')
        family?: string,
        @Query('genus')
        genus?: string
    ) {
        return this.taxonomyService.findByClassification({
            phylum,
            class: className,
            order,
            family,
            genus,
        });
    }

    /**
     * GET /taxonomy
     * Paginated list of all taxonomies
     * Example: /taxonomy?page=1&limit=20
     */
    @Get()
    async findAll(
        @Query('page')
        page?: number,
        @Query('limit')
        limit?: number
    ) {
        return this.taxonomyService.findAll({
            page: page ? Number(page) : 1,
            limit: limit ? Number(limit) : 20,
        });
    }
}
