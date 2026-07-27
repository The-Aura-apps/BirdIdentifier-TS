import { MigrationInterface, QueryRunner } from "typeorm";

export class AddHabitatDescriptions1785115598228 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            UPDATE habitats SET description = CASE name
                WHEN 'Desert' THEN 'Arid regions with minimal rainfall, sparse vegetation, and extreme temperature swings between day and night.'
                WHEN 'Forest' THEN 'Densely wooded areas dominated by trees, ranging from temperate woodlands to tropical rainforests.'
                WHEN 'Grassland' THEN 'Open landscapes dominated by grasses and herbaceous plants, with few trees.'
                WHEN 'Savanna' THEN 'Grassland ecosystems scattered with trees and shrubs, typically found in tropical and subtropical regions with distinct wet and dry seasons.'
                WHEN 'Scrub' THEN 'Land covered mainly by shrubs, small trees, and drought-resistant vegetation, often found in transitional or semi-arid areas.'
                WHEN 'Subterranean' THEN 'Underground habitats such as caves, burrows, and rock crevices, characterized by darkness and stable temperatures.'
                WHEN 'Wetlands' THEN 'Areas saturated with water, such as marshes, swamps, and bogs, supporting water-adapted vegetation and wildlife.'
                WHEN 'Marine' THEN 'Ocean and coastal habitats, including open water, reefs, and shorelines, characterized by saltwater environments.'
                ELSE description
            END
            WHERE name IN ('Desert', 'Forest', 'Grassland', 'Savanna', 'Scrub', 'Subterranean', 'Wetlands', 'Marine');
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            UPDATE habitats SET description = NULL
            WHERE name IN ('Desert', 'Forest', 'Grassland', 'Savanna', 'Scrub', 'Subterranean', 'Wetlands', 'Marine');
        `);
    }
}
