import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialMigration1762085486550 implements MigrationInterface {
    name = 'InitialMigration1762085486550';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "taxonomy" DROP CONSTRAINT "FK_7526afb959d2bd28bf9dabba059"`
        );
        await queryRunner.query(
            `ALTER TABLE "taxonomy" DROP CONSTRAINT "unique_taxonomy"`
        );
        await queryRunner.query(
            `ALTER TABLE "taxonomy" DROP CONSTRAINT "UQ_7526afb959d2bd28bf9dabba059"`
        );
        await queryRunner.query(`ALTER TABLE "taxonomy" DROP COLUMN "bird_id"`);
        await queryRunner.query(
            `ALTER TABLE "taxonomy" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`
        );
        await queryRunner.query(
            `ALTER TABLE "taxonomy" ADD "updatedAt" TIMESTAMP NOT NULL DEFAULT now()`
        );
        await queryRunner.query(
            `ALTER TABLE "birds" ADD "taxonomy_id" integer`
        );
        await queryRunner.query(
            `CREATE UNIQUE INDEX "IDX_4a081f96b7eb705c4ffe4b4a70" ON "taxonomy" ("phylum", "class", "order", "family", "genus") `
        );
        await queryRunner.query(
            `ALTER TABLE "birds" ADD CONSTRAINT "FK_d93529f0ca0d61032ba30f5d1f3" FOREIGN KEY ("taxonomy_id") REFERENCES "taxonomy"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "birds" DROP CONSTRAINT "FK_d93529f0ca0d61032ba30f5d1f3"`
        );
        await queryRunner.query(
            `DROP INDEX "public"."IDX_4a081f96b7eb705c4ffe4b4a70"`
        );
        await queryRunner.query(
            `ALTER TABLE "birds" DROP COLUMN "taxonomy_id"`
        );
        await queryRunner.query(
            `ALTER TABLE "taxonomy" DROP COLUMN "updatedAt"`
        );
        await queryRunner.query(
            `ALTER TABLE "taxonomy" DROP COLUMN "createdAt"`
        );
        await queryRunner.query(
            `ALTER TABLE "taxonomy" ADD "bird_id" integer NOT NULL`
        );
        await queryRunner.query(
            `ALTER TABLE "taxonomy" ADD CONSTRAINT "UQ_7526afb959d2bd28bf9dabba059" UNIQUE ("bird_id")`
        );
        await queryRunner.query(
            `ALTER TABLE "taxonomy" ADD CONSTRAINT "unique_taxonomy" UNIQUE ("class", "family", "genus", "order", "phylum")`
        );
        await queryRunner.query(
            `ALTER TABLE "taxonomy" ADD CONSTRAINT "FK_7526afb959d2bd28bf9dabba059" FOREIGN KEY ("bird_id") REFERENCES "birds"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
        );
    }
}
