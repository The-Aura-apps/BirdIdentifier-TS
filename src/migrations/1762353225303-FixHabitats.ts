import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixHabitats1762353225303 implements MigrationInterface {
    name = 'FixHabitats1762353225303';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "habitats" DROP COLUMN "iconUrl"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "habitats" ADD "iconUrl" character varying(500)`);
    }
}
