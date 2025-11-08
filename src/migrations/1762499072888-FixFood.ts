import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixFood1762499072888 implements MigrationInterface {
    name = 'FixFood1762499072888';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_b2b76ac9dc5261d88a5fec61ca"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_bb1235e82f7fccb9022e61311d"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_6692b9d206044a0bc74c026956"`);
        await queryRunner.query(`ALTER TABLE "bird_distributions" DROP COLUMN "season"`);
        await queryRunner.query(`DROP TYPE "public"."bird_distributions_season_enum"`);
        await queryRunner.query(
            `ALTER TABLE "bird_foods" ADD "created_at" TIMESTAMP NOT NULL DEFAULT now()`,
        );
        await queryRunner.query(
            `ALTER TABLE "bird_foods" ADD "updated_at" TIMESTAMP NOT NULL DEFAULT now()`,
        );
        await queryRunner.query(`ALTER TABLE "bird_distributions" ADD "month" integer NOT NULL`);
        await queryRunner.query(`ALTER TABLE "bird_distributions" ADD "location" jsonb`);
        await queryRunner.query(
            `ALTER TABLE "bird_distributions" ADD "presenceScore" double precision`,
        );
        await queryRunner.query(
            `ALTER TABLE "media" DROP CONSTRAINT "FK_3a9de5f53f14ca2bbb9b938ad4f"`,
        );
        await queryRunner.query(`ALTER TABLE "media" ALTER COLUMN "bird_id" DROP NOT NULL`);
        await queryRunner.query(
            `ALTER TABLE "bird_foods" ALTER COLUMN "isActive" SET DEFAULT true`,
        );
        await queryRunner.query(
            `ALTER TABLE "bird_distributions" DROP CONSTRAINT "FK_94e21b289c7cc6bb9284d17ed37"`,
        );
        await queryRunner.query(
            `ALTER TABLE "bird_distributions" ALTER COLUMN "bird_id" DROP NOT NULL`,
        );
        await queryRunner.query(
            `CREATE INDEX "IDX_3b9f24bd122cde4c4c3072a906" ON "media" ("orderIndex") `,
        );
        await queryRunner.query(
            `CREATE INDEX "IDX_637a0dd7f9068a9ca80decee00" ON "media" ("type") `,
        );
        await queryRunner.query(
            `CREATE INDEX "IDX_6bdce84921665f8443703f56b7" ON "bird_distributions" ("location") `,
        );
        await queryRunner.query(
            `ALTER TABLE "media" ADD CONSTRAINT "FK_3a9de5f53f14ca2bbb9b938ad4f" FOREIGN KEY ("bird_id") REFERENCES "birds"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "bird_distributions" ADD CONSTRAINT "FK_94e21b289c7cc6bb9284d17ed37" FOREIGN KEY ("bird_id") REFERENCES "birds"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "bird_distributions" DROP CONSTRAINT "FK_94e21b289c7cc6bb9284d17ed37"`,
        );
        await queryRunner.query(
            `ALTER TABLE "media" DROP CONSTRAINT "FK_3a9de5f53f14ca2bbb9b938ad4f"`,
        );
        await queryRunner.query(`DROP INDEX "public"."IDX_6bdce84921665f8443703f56b7"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_637a0dd7f9068a9ca80decee00"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_3b9f24bd122cde4c4c3072a906"`);
        await queryRunner.query(
            `ALTER TABLE "bird_distributions" ALTER COLUMN "bird_id" SET NOT NULL`,
        );
        await queryRunner.query(
            `ALTER TABLE "bird_distributions" ADD CONSTRAINT "FK_94e21b289c7cc6bb9284d17ed37" FOREIGN KEY ("bird_id") REFERENCES "birds"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "bird_foods" ALTER COLUMN "isActive" SET DEFAULT false`,
        );
        await queryRunner.query(`ALTER TABLE "media" ALTER COLUMN "bird_id" SET NOT NULL`);
        await queryRunner.query(
            `ALTER TABLE "media" ADD CONSTRAINT "FK_3a9de5f53f14ca2bbb9b938ad4f" FOREIGN KEY ("bird_id") REFERENCES "birds"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(`ALTER TABLE "bird_distributions" DROP COLUMN "presenceScore"`);
        await queryRunner.query(`ALTER TABLE "bird_distributions" DROP COLUMN "location"`);
        await queryRunner.query(`ALTER TABLE "bird_distributions" DROP COLUMN "month"`);
        await queryRunner.query(`ALTER TABLE "bird_foods" DROP COLUMN "updated_at"`);
        await queryRunner.query(`ALTER TABLE "bird_foods" DROP COLUMN "created_at"`);
        await queryRunner.query(
            `CREATE TYPE "public"."bird_distributions_season_enum" AS ENUM('breeding', 'non-breeding', 'year-round', 'migration')`,
        );
        await queryRunner.query(
            `ALTER TABLE "bird_distributions" ADD "season" "public"."bird_distributions_season_enum" NOT NULL`,
        );
        await queryRunner.query(
            `CREATE INDEX "IDX_6692b9d206044a0bc74c026956" ON "bird_distributions" ("bird_id", "season") `,
        );
        await queryRunner.query(
            `CREATE INDEX "IDX_bb1235e82f7fccb9022e61311d" ON "media" ("bird_id", "type") `,
        );
        await queryRunner.query(
            `CREATE INDEX "IDX_b2b76ac9dc5261d88a5fec61ca" ON "media" ("bird_id", "orderIndex") `,
        );
    }
}
