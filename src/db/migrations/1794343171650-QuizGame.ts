import { MigrationInterface, QueryRunner } from 'typeorm';

export class QuizGame1794343171650 implements MigrationInterface {
  name = 'QuizGame1794343171650';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "questions" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "body" character varying(500) NOT NULL, "correct_answers" jsonb NOT NULL DEFAULT '[]', "published" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE, "deleted_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_08a6d4b0f49ff300bf3a0ca60ac" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "answers" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "player_id" uuid NOT NULL, "question_id" uuid NOT NULL, "status" character varying(10) NOT NULL, "added_at" TIMESTAMP WITH TIME ZONE NOT NULL, CONSTRAINT "PK_9c32cec6c71e06da0254f2226c6" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_d432f3b8472a4579de8a7e6927" ON "answers"  ("player_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "game_players" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "game_id" uuid NOT NULL, "user_id" uuid NOT NULL, "position" smallint NOT NULL, "score" integer NOT NULL DEFAULT '0', "finished_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_a99af25a1c97122f04ba778197c" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b9adcb616544097a980720bbcc" ON "game_players"  ("user_id") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "idx_game_players_game_position_unique" ON "game_players"  ("game_id", "position") `,
    );
    await queryRunner.query(
      `CREATE TABLE "game_questions" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "game_id" uuid NOT NULL, "question_id" uuid NOT NULL, "position" smallint NOT NULL, CONSTRAINT "PK_8655fa1f9639162ee24c3a5582a" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "idx_game_questions_game_position_unique" ON "game_questions"  ("game_id", "position") `,
    );
    await queryRunner.query(
      `CREATE TABLE "games" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "status" character varying(20) NOT NULL, "pair_created_date" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "start_game_date" TIMESTAMP WITH TIME ZONE, "finish_game_date" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_c9b16b62917b5595af982d66337" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_05318b3cbff2443bd581093bcb" ON "games"  ("status") `,
    );
    await queryRunner.query(
      `ALTER TABLE "answers" ADD CONSTRAINT "FK_d432f3b8472a4579de8a7e69279" FOREIGN KEY ("player_id") REFERENCES "game_players"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "answers" ADD CONSTRAINT "FK_677120094cf6d3f12df0b9dc5d3" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "game_players" ADD CONSTRAINT "FK_67b26bf4c76bd09a206d504824b" FOREIGN KEY ("game_id") REFERENCES "games"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "game_players" ADD CONSTRAINT "FK_b9adcb616544097a980720bbcc6" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "game_questions" ADD CONSTRAINT "FK_4c5351759926b365b1572dbdd1e" FOREIGN KEY ("game_id") REFERENCES "games"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "game_questions" ADD CONSTRAINT "FK_8b122e0afbb8b1a90a9b8c8ab56" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "game_questions" DROP CONSTRAINT "FK_8b122e0afbb8b1a90a9b8c8ab56"`,
    );
    await queryRunner.query(
      `ALTER TABLE "game_questions" DROP CONSTRAINT "FK_4c5351759926b365b1572dbdd1e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "game_players" DROP CONSTRAINT "FK_b9adcb616544097a980720bbcc6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "game_players" DROP CONSTRAINT "FK_67b26bf4c76bd09a206d504824b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "answers" DROP CONSTRAINT "FK_677120094cf6d3f12df0b9dc5d3"`,
    );
    await queryRunner.query(
      `ALTER TABLE "answers" DROP CONSTRAINT "FK_d432f3b8472a4579de8a7e69279"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_05318b3cbff2443bd581093bcb"`,
    );
    await queryRunner.query(`DROP TABLE "games"`);
    await queryRunner.query(
      `DROP INDEX "public"."idx_game_questions_game_position_unique"`,
    );
    await queryRunner.query(`DROP TABLE "game_questions"`);
    await queryRunner.query(
      `DROP INDEX "public"."idx_game_players_game_position_unique"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_b9adcb616544097a980720bbcc"`,
    );
    await queryRunner.query(`DROP TABLE "game_players"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_d432f3b8472a4579de8a7e6927"`,
    );
    await queryRunner.query(`DROP TABLE "answers"`);
    await queryRunner.query(`DROP TABLE "questions"`);
  }
}
