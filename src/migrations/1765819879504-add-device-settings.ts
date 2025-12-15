import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDeviceSettings1765819879504 implements MigrationInterface {
    name = 'AddDeviceSettings1765819879504'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."device_settings_identificationmethod_enum" AS ENUM('photo', 'sound', 'photo_sound')`);
        await queryRunner.query(`CREATE TYPE "public"."device_settings_userpurpose_enum" AS ENUM('for_fun', 'hunting', 'keeping_birds', 'just_interested')`);
        await queryRunner.query(`CREATE TABLE "device_settings" ("id" SERIAL NOT NULL, "deviceId" character varying NOT NULL, "identificationMethod" "public"."device_settings_identificationmethod_enum" NOT NULL, "userPurpose" "public"."device_settings_userpurpose_enum" NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_6bbbb3a4850babf14ec952ca60a" UNIQUE ("deviceId"), CONSTRAINT "PK_fab27d904a803723659053fdbe7" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "device_settings"`);
        await queryRunner.query(`DROP TYPE "public"."device_settings_userpurpose_enum"`);
        await queryRunner.query(`DROP TYPE "public"."device_settings_identificationmethod_enum"`);
    }

}
