import { MigrationInterface, QueryRunner } from "typeorm";

export class FixConservationStatus1762188452100 implements MigrationInterface {
    name = 'FixConservationStatus1762188452100'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "birds" DROP CONSTRAINT "FK_e35a144a6805de1313daf95e027"`);
        await queryRunner.query(`ALTER TABLE "birds" DROP CONSTRAINT "FK_d93529f0ca0d61032ba30f5d1f3"`);
        await queryRunner.query(`ALTER TABLE "birds" ADD CONSTRAINT "FK_d93529f0ca0d61032ba30f5d1f3" FOREIGN KEY ("taxonomy_id") REFERENCES "taxonomy"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "birds" ADD CONSTRAINT "FK_e35a144a6805de1313daf95e027" FOREIGN KEY ("conservation_status_id") REFERENCES "conservation_statuses"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "birds" DROP CONSTRAINT "FK_e35a144a6805de1313daf95e027"`);
        await queryRunner.query(`ALTER TABLE "birds" DROP CONSTRAINT "FK_d93529f0ca0d61032ba30f5d1f3"`);
        await queryRunner.query(`ALTER TABLE "birds" ADD CONSTRAINT "FK_d93529f0ca0d61032ba30f5d1f3" FOREIGN KEY ("taxonomy_id") REFERENCES "taxonomy"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "birds" ADD CONSTRAINT "FK_e35a144a6805de1313daf95e027" FOREIGN KEY ("conservation_status_id") REFERENCES "conservation_statuses"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
