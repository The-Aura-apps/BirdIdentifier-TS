import { MigrationInterface, QueryRunner } from "typeorm";

export class SeedHabitats1780789104461 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            INSERT INTO habitats (name)
            VALUES
                ('Desert'),
                ('Forest'),
                ('Grassland'),
                ('Savanna'),
                ('Scrub'),
                ('Subterranean'),
                ('Wetlands'),
                ('Marine')
            ON CONFLICT (name) DO NOTHING;
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DELETE FROM habitats
            WHERE name IN (
                'Desert',
                'Forest',
                'Grassland',
                'Savanna',
                'Scrub',
                'Subterranean',
                'Wetlands',
                'Marine'
            );
        `);
    }
}