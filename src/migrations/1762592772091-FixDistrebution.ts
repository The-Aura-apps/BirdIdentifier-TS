import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixDistrebution1762592772091 implements MigrationInterface {
    name = 'FixDistrebution1762592772091';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_6bdce84921665f8443703f56b7"`);
        await queryRunner.query(
            `CREATE TYPE "public"."bird_distributions_season_enum" AS ENUM('breeding', 'non-breeding', 'year-round', 'migration')`,
        );
        await queryRunner.query(
            `ALTER TABLE "bird_distributions" ADD "season" "public"."bird_distributions_season_enum" NOT NULL`,
        );
        await queryRunner.query(
            `ALTER TABLE "bird_distributions" DROP CONSTRAINT "FK_94e21b289c7cc6bb9284d17ed37"`,
        );
        await queryRunner.query(
            `ALTER TABLE "bird_distributions" ALTER COLUMN "bird_id" SET NOT NULL`,
        );
        await queryRunner.query(
            `CREATE INDEX "IDX_490f81ad379736ed6ff147468a" ON "bird_distributions" ("month") `,
        );
        await queryRunner.query(
            `CREATE INDEX "IDX_b78e8e7463a792f33e3302fd53" ON "bird_distributions" ("season") `,
        );
        await queryRunner.query(
            `ALTER TABLE "bird_distributions" ADD CONSTRAINT "FK_94e21b289c7cc6bb9284d17ed37" FOREIGN KEY ("bird_id") REFERENCES "birds"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "bird_distributions" DROP CONSTRAINT "FK_94e21b289c7cc6bb9284d17ed37"`,
        );
        await queryRunner.query(`DROP INDEX "public"."IDX_b78e8e7463a792f33e3302fd53"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_490f81ad379736ed6ff147468a"`);
        await queryRunner.query(
            `ALTER TABLE "bird_distributions" ALTER COLUMN "bird_id" DROP NOT NULL`,
        );
        await queryRunner.query(
            `ALTER TABLE "bird_distributions" ADD CONSTRAINT "FK_94e21b289c7cc6bb9284d17ed37" FOREIGN KEY ("bird_id") REFERENCES "birds"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(`ALTER TABLE "bird_distributions" DROP COLUMN "season"`);
        await queryRunner.query(`DROP TYPE "public"."bird_distributions_season_enum"`);
        await queryRunner.query(
            `CREATE INDEX "IDX_6bdce84921665f8443703f56b7" ON "bird_distributions" ("location") `,
        );
    }
}
