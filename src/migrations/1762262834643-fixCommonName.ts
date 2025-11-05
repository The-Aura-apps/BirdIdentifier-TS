import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixCommonName1762262834643 implements MigrationInterface {
    name = 'FixCommonName1762262834643';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `DROP INDEX "public"."IDX_e3198a9303ff141f77dae2cb15"`
        );
        await queryRunner.query(
            `ALTER TABLE "common_names" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`
        );
        await queryRunner.query(
            `ALTER TABLE "common_names" ADD "updatedAt" TIMESTAMP NOT NULL DEFAULT now()`
        );
        await queryRunner.query(
            `CREATE UNIQUE INDEX "IDX_ac0ee6ac532a46891fca986220" ON "common_names" ("bird_id", "name", "language") `
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `DROP INDEX "public"."IDX_ac0ee6ac532a46891fca986220"`
        );
        await queryRunner.query(
            `ALTER TABLE "common_names" DROP COLUMN "updatedAt"`
        );
        await queryRunner.query(
            `ALTER TABLE "common_names" DROP COLUMN "createdAt"`
        );
        await queryRunner.query(
            `CREATE INDEX "IDX_e3198a9303ff141f77dae2cb15" ON "common_names" ("name") `
        );
    }
}
