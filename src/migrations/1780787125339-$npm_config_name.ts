import { MigrationInterface, QueryRunner } from "typeorm";

export class  $npmConfigName1780787125339 implements MigrationInterface {
    name = ' $npmConfigName1780787125339'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."media_type_enum" AS ENUM('photo', 'audio', 'video')`);
        await queryRunner.query(`CREATE TABLE "media" ("id" SERIAL NOT NULL, "storageKey" character varying(500) NOT NULL, "type" "public"."media_type_enum" NOT NULL DEFAULT 'photo', "size" character varying, "caption" character varying(255), "source" character varying(255), "attribution" character varying(255), "orderIndex" integer NOT NULL DEFAULT '0', "metadata" jsonb, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "bird_id" integer NOT NULL, CONSTRAINT "PK_f4e0fcac36e050de337b670d8bd" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_3b9f24bd122cde4c4c3072a906" ON "media" ("orderIndex") `);
        await queryRunner.query(`CREATE INDEX "IDX_637a0dd7f9068a9ca80decee00" ON "media" ("type") `);
        await queryRunner.query(`CREATE TABLE "foods" ("id" SERIAL NOT NULL, "name" character varying(255) NOT NULL, "description" text, "imageStorageKey" character varying(500), CONSTRAINT "UQ_c3cf46642750fce8fea692ad946" UNIQUE ("name"), CONSTRAINT "PK_0cc83421325632f61fa27a52b59" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_c3cf46642750fce8fea692ad94" ON "foods" ("name") `);
        await queryRunner.query(`CREATE TABLE "bird_foods" ("id" SERIAL NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "bird_id" integer NOT NULL, "food_id" integer NOT NULL, CONSTRAINT "PK_132e19a7434923cbab9ca6c3234" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_7c8d76a4530e449b670ad3fda0" ON "bird_foods" ("bird_id", "food_id") `);
        await queryRunner.query(`CREATE TABLE "common_names" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "language" character varying(10) NOT NULL DEFAULT 'en', "region" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "bird_id" integer NOT NULL, CONSTRAINT "PK_47a1748c20d65a3b5aa528aa858" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_ac0ee6ac532a46891fca986220" ON "common_names" ("bird_id", "name", "language") `);
        await queryRunner.query(`CREATE TYPE "public"."conservation_statuses_code_enum" AS ENUM('EX', 'EW', 'CR', 'EN', 'VU', 'NT', 'LC', 'DD', 'NE')`);
        await queryRunner.query(`CREATE TABLE "conservation_statuses" ("id" SERIAL NOT NULL, "code" "public"."conservation_statuses_code_enum" NOT NULL, "fullName" character varying(100) NOT NULL, "description" text, "severityLevel" integer NOT NULL DEFAULT '0', "authority" character varying(50) NOT NULL DEFAULT 'IUCN', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_c5f089974a8264f271ab80a3da9" UNIQUE ("code"), CONSTRAINT "PK_ded77972cd5732bff7c8a15b53a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_c5f089974a8264f271ab80a3da" ON "conservation_statuses" ("code") `);
        await queryRunner.query(`CREATE TABLE "taxonomy" ("id" SERIAL NOT NULL, "phylum" character varying(100) NOT NULL DEFAULT 'Chordata', "class" character varying(100) NOT NULL DEFAULT 'Aves', "order" character varying(100) NOT NULL, "family" character varying(100) NOT NULL, "genus" character varying(100) NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_36dd19c538ef0f3d368a5ed1e09" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_4a081f96b7eb705c4ffe4b4a70" ON "taxonomy" ("phylum", "class", "order", "family", "genus") `);
        await queryRunner.query(`CREATE TYPE "public"."bird_distributions_season_enum" AS ENUM('breeding', 'non-breeding', 'year-round', 'migration')`);
        await queryRunner.query(`CREATE TABLE "bird_distributions" ("id" SERIAL NOT NULL, "month" integer NOT NULL, "season" "public"."bird_distributions_season_enum" NOT NULL, "location" jsonb, "presenceScore" double precision, "description" text, "countries" jsonb, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "bird_id" integer NOT NULL, CONSTRAINT "PK_2896a9bde192b15125a205d7920" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_490f81ad379736ed6ff147468a" ON "bird_distributions" ("month") `);
        await queryRunner.query(`CREATE INDEX "IDX_b78e8e7463a792f33e3302fd53" ON "bird_distributions" ("season") `);
        await queryRunner.query(`CREATE TABLE "habitats" ("id" SERIAL NOT NULL, "name" character varying(100) NOT NULL, "description" text, CONSTRAINT "UQ_63cfbf4a9393c728c9673440298" UNIQUE ("name"), CONSTRAINT "PK_1d6e7a888814106d17f07d7d418" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_63cfbf4a9393c728c967344029" ON "habitats" ("name") `);
        await queryRunner.query(`CREATE TABLE "birds" ("id" SERIAL NOT NULL, "scientificName" character varying(255) NOT NULL, "description" text, "behavior" text, "nestingHabits" text, "feedingHabits" text, "eggsDescription" text, "coolFacts" text, "size" jsonb, "lifeExpectancyYears" numeric(4,1), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "taxonomy_id" integer, "conservation_status_id" integer, CONSTRAINT "UQ_615412e156787a2a675d96f1fab" UNIQUE ("scientificName"), CONSTRAINT "PK_c3bd28e54c6448f5dac12d0ce30" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_615412e156787a2a675d96f1fa" ON "birds" ("scientificName") `);
        await queryRunner.query(`CREATE TYPE "public"."observations_status_enum" AS ENUM('pending', 'processing', 'completed', 'failed')`);
        await queryRunner.query(`CREATE TABLE "observations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "deviceId" character varying NOT NULL, "type" character varying(10) NOT NULL, "status" "public"."observations_status_enum" NOT NULL DEFAULT 'pending', "upload_id" integer NOT NULL, "bird_id" integer, "aiResult" jsonb, "confidence" numeric(5,4), "errorMessage" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_f9208d64f50a76030758087c0ef" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_2f0f67b5db385d517826d5944b" ON "observations" ("status") `);
        await queryRunner.query(`CREATE INDEX "IDX_cc5ae70eecc038af674baa9131" ON "observations" ("deviceId", "createdAt") `);
        await queryRunner.query(`CREATE TABLE "uploads" ("id" SERIAL NOT NULL, "file_name" character varying NOT NULL, "mime_type" character varying NOT NULL, "type" character varying(10) NOT NULL, "file_data" bytea NOT NULL, "checksum" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_d164eb65c2c6d2c0c118b165e9e" UNIQUE ("checksum"), CONSTRAINT "PK_d1781d1eedd7459314f60f39bd3" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_d164eb65c2c6d2c0c118b165e9" ON "uploads" ("checksum") `);
        await queryRunner.query(`CREATE TYPE "public"."device_settings_identificationmethod_enum" AS ENUM('photo', 'sound', 'photo_sound')`);
        await queryRunner.query(`CREATE TYPE "public"."device_settings_userpurpose_enum" AS ENUM('for_fun', 'hunting', 'keeping_birds', 'just_interested')`);
        await queryRunner.query(`CREATE TABLE "device_settings" ("id" SERIAL NOT NULL, "deviceId" character varying NOT NULL, "identificationMethod" "public"."device_settings_identificationmethod_enum" NOT NULL, "userPurpose" "public"."device_settings_userpurpose_enum" NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_6bbbb3a4850babf14ec952ca60a" UNIQUE ("deviceId"), CONSTRAINT "PK_fab27d904a803723659053fdbe7" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "articles" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying(255) NOT NULL, "content" text NOT NULL, "photoUrl" character varying(500), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_0a6e2c450d83e0b6052c2793334" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "bird_habitats" ("bird_id" integer NOT NULL, "habitat_id" integer NOT NULL, CONSTRAINT "PK_641148351806645c1832fadbc84" PRIMARY KEY ("bird_id", "habitat_id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_03814dc4025bae8d92f6bca008" ON "bird_habitats" ("bird_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_77a407660c33af138d6967c41d" ON "bird_habitats" ("habitat_id") `);
        await queryRunner.query(`ALTER TABLE "media" ADD CONSTRAINT "FK_3a9de5f53f14ca2bbb9b938ad4f" FOREIGN KEY ("bird_id") REFERENCES "birds"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "bird_foods" ADD CONSTRAINT "FK_665107f6bbcd3176a55fbd0de46" FOREIGN KEY ("bird_id") REFERENCES "birds"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "bird_foods" ADD CONSTRAINT "FK_ff7c69143be2be8efe9054135a6" FOREIGN KEY ("food_id") REFERENCES "foods"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "common_names" ADD CONSTRAINT "FK_2fd20370787b50a48cc26b31784" FOREIGN KEY ("bird_id") REFERENCES "birds"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "bird_distributions" ADD CONSTRAINT "FK_94e21b289c7cc6bb9284d17ed37" FOREIGN KEY ("bird_id") REFERENCES "birds"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "birds" ADD CONSTRAINT "FK_d93529f0ca0d61032ba30f5d1f3" FOREIGN KEY ("taxonomy_id") REFERENCES "taxonomy"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "birds" ADD CONSTRAINT "FK_e35a144a6805de1313daf95e027" FOREIGN KEY ("conservation_status_id") REFERENCES "conservation_statuses"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "observations" ADD CONSTRAINT "FK_ad2721b7f0dd48c01aa618f41af" FOREIGN KEY ("upload_id") REFERENCES "uploads"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "observations" ADD CONSTRAINT "FK_f00a5878e620915ebdaa4558f10" FOREIGN KEY ("bird_id") REFERENCES "birds"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "bird_habitats" ADD CONSTRAINT "FK_03814dc4025bae8d92f6bca0089" FOREIGN KEY ("bird_id") REFERENCES "birds"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "bird_habitats" ADD CONSTRAINT "FK_77a407660c33af138d6967c41dc" FOREIGN KEY ("habitat_id") REFERENCES "habitats"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "bird_habitats" DROP CONSTRAINT "FK_77a407660c33af138d6967c41dc"`);
        await queryRunner.query(`ALTER TABLE "bird_habitats" DROP CONSTRAINT "FK_03814dc4025bae8d92f6bca0089"`);
        await queryRunner.query(`ALTER TABLE "observations" DROP CONSTRAINT "FK_f00a5878e620915ebdaa4558f10"`);
        await queryRunner.query(`ALTER TABLE "observations" DROP CONSTRAINT "FK_ad2721b7f0dd48c01aa618f41af"`);
        await queryRunner.query(`ALTER TABLE "birds" DROP CONSTRAINT "FK_e35a144a6805de1313daf95e027"`);
        await queryRunner.query(`ALTER TABLE "birds" DROP CONSTRAINT "FK_d93529f0ca0d61032ba30f5d1f3"`);
        await queryRunner.query(`ALTER TABLE "bird_distributions" DROP CONSTRAINT "FK_94e21b289c7cc6bb9284d17ed37"`);
        await queryRunner.query(`ALTER TABLE "common_names" DROP CONSTRAINT "FK_2fd20370787b50a48cc26b31784"`);
        await queryRunner.query(`ALTER TABLE "bird_foods" DROP CONSTRAINT "FK_ff7c69143be2be8efe9054135a6"`);
        await queryRunner.query(`ALTER TABLE "bird_foods" DROP CONSTRAINT "FK_665107f6bbcd3176a55fbd0de46"`);
        await queryRunner.query(`ALTER TABLE "media" DROP CONSTRAINT "FK_3a9de5f53f14ca2bbb9b938ad4f"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_77a407660c33af138d6967c41d"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_03814dc4025bae8d92f6bca008"`);
        await queryRunner.query(`DROP TABLE "bird_habitats"`);
        await queryRunner.query(`DROP TABLE "articles"`);
        await queryRunner.query(`DROP TABLE "device_settings"`);
        await queryRunner.query(`DROP TYPE "public"."device_settings_userpurpose_enum"`);
        await queryRunner.query(`DROP TYPE "public"."device_settings_identificationmethod_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_d164eb65c2c6d2c0c118b165e9"`);
        await queryRunner.query(`DROP TABLE "uploads"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_cc5ae70eecc038af674baa9131"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_2f0f67b5db385d517826d5944b"`);
        await queryRunner.query(`DROP TABLE "observations"`);
        await queryRunner.query(`DROP TYPE "public"."observations_status_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_615412e156787a2a675d96f1fa"`);
        await queryRunner.query(`DROP TABLE "birds"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_63cfbf4a9393c728c967344029"`);
        await queryRunner.query(`DROP TABLE "habitats"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b78e8e7463a792f33e3302fd53"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_490f81ad379736ed6ff147468a"`);
        await queryRunner.query(`DROP TABLE "bird_distributions"`);
        await queryRunner.query(`DROP TYPE "public"."bird_distributions_season_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_4a081f96b7eb705c4ffe4b4a70"`);
        await queryRunner.query(`DROP TABLE "taxonomy"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_c5f089974a8264f271ab80a3da"`);
        await queryRunner.query(`DROP TABLE "conservation_statuses"`);
        await queryRunner.query(`DROP TYPE "public"."conservation_statuses_code_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ac0ee6ac532a46891fca986220"`);
        await queryRunner.query(`DROP TABLE "common_names"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_7c8d76a4530e449b670ad3fda0"`);
        await queryRunner.query(`DROP TABLE "bird_foods"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_c3cf46642750fce8fea692ad94"`);
        await queryRunner.query(`DROP TABLE "foods"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_637a0dd7f9068a9ca80decee00"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_3b9f24bd122cde4c4c3072a906"`);
        await queryRunner.query(`DROP TABLE "media"`);
        await queryRunner.query(`DROP TYPE "public"."media_type_enum"`);
    }

}
