import { MigrationInterface, QueryRunner } from "typeorm";

export class FixMedia1762608465709 implements MigrationInterface {
    name = 'FixMedia1762608465709'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "media" DROP CONSTRAINT "FK_3a9de5f53f14ca2bbb9b938ad4f"`);
        await queryRunner.query(`ALTER TABLE "media" ALTER COLUMN "bird_id" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "media" ADD CONSTRAINT "FK_3a9de5f53f14ca2bbb9b938ad4f" FOREIGN KEY ("bird_id") REFERENCES "birds"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "media" DROP CONSTRAINT "FK_3a9de5f53f14ca2bbb9b938ad4f"`);
        await queryRunner.query(`ALTER TABLE "media" ALTER COLUMN "bird_id" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "media" ADD CONSTRAINT "FK_3a9de5f53f14ca2bbb9b938ad4f" FOREIGN KEY ("bird_id") REFERENCES "birds"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
