import { MigrationInterface, QueryRunner } from 'typeorm';

export class BloggerPlatform1794312107155 implements MigrationInterface {
  name = 'BloggerPlatform1794312107155';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "comments" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "content" character varying(300) NOT NULL, "commentator_user_id" uuid NOT NULL, "post_id" uuid NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_8bf68bc960f2b69e818bdb90dcb" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_259bf9825d9d198608d1b46b0b" ON "comments"  ("post_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "posts" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "title" character varying(30) NOT NULL, "short_description" character varying(100) NOT NULL, "content" character varying(1000) NOT NULL, "blog_id" uuid NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_2829ac61eff60fcec60d7274b9e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_7689491fe4377a8090576a799a" ON "posts"  ("blog_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "blogs" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "name" character varying(15) NOT NULL, "description" character varying(500) NOT NULL, "website_url" character varying(100) NOT NULL, "is_membership" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_e113335f11c926da929a625f118" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."like_status" AS ENUM('None', 'Like', 'Dislike')`,
    );
    await queryRunner.query(
      `CREATE TABLE "post_likes" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "user_id" uuid NOT NULL, "status" "public"."like_status" NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "post_id" uuid NOT NULL, CONSTRAINT "PK_e4ac7cb9daf243939c6eabb2e0d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b40d37469c501092203d285af8" ON "post_likes"  ("post_id") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "idx_post_likes_user_post_unique" ON "post_likes"  ("user_id", "post_id") `,
    );
    // like_status enum is shared with post_likes, created above
    await queryRunner.query(
      `CREATE TABLE "comment_likes" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "user_id" uuid NOT NULL, "status" "public"."like_status" NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "comment_id" uuid NOT NULL, CONSTRAINT "PK_2c299aaf1f903c45ee7e6c7b419" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_2073bf518ef7017ec19319a65e" ON "comment_likes"  ("comment_id") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "idx_comment_likes_user_comment_unique" ON "comment_likes"  ("user_id", "comment_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "comments" ADD CONSTRAINT "FK_db00768f42c38c5617d3ad4e52b" FOREIGN KEY ("commentator_user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "comments" ADD CONSTRAINT "FK_259bf9825d9d198608d1b46b0b5" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "posts" ADD CONSTRAINT "FK_7689491fe4377a8090576a799a0" FOREIGN KEY ("blog_id") REFERENCES "blogs"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "post_likes" ADD CONSTRAINT "FK_9b9a7fc5eeff133cf71b8e06a7b" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "post_likes" ADD CONSTRAINT "FK_b40d37469c501092203d285af80" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "comment_likes" ADD CONSTRAINT "FK_bdba9a10c64ff58d36b09e3ac45" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "comment_likes" ADD CONSTRAINT "FK_2073bf518ef7017ec19319a65e5" FOREIGN KEY ("comment_id") REFERENCES "comments"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "comment_likes" DROP CONSTRAINT "FK_2073bf518ef7017ec19319a65e5"`,
    );
    await queryRunner.query(
      `ALTER TABLE "comment_likes" DROP CONSTRAINT "FK_bdba9a10c64ff58d36b09e3ac45"`,
    );
    await queryRunner.query(
      `ALTER TABLE "post_likes" DROP CONSTRAINT "FK_b40d37469c501092203d285af80"`,
    );
    await queryRunner.query(
      `ALTER TABLE "post_likes" DROP CONSTRAINT "FK_9b9a7fc5eeff133cf71b8e06a7b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "posts" DROP CONSTRAINT "FK_7689491fe4377a8090576a799a0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "comments" DROP CONSTRAINT "FK_259bf9825d9d198608d1b46b0b5"`,
    );
    await queryRunner.query(
      `ALTER TABLE "comments" DROP CONSTRAINT "FK_db00768f42c38c5617d3ad4e52b"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_comment_likes_user_comment_unique"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_2073bf518ef7017ec19319a65e"`,
    );
    await queryRunner.query(`DROP TABLE "comment_likes"`);
    // like_status enum is shared with comment_likes, dropped below
    await queryRunner.query(
      `DROP INDEX "public"."idx_post_likes_user_post_unique"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_b40d37469c501092203d285af8"`,
    );
    await queryRunner.query(`DROP TABLE "post_likes"`);
    await queryRunner.query(`DROP TYPE "public"."like_status"`);
    await queryRunner.query(`DROP TABLE "blogs"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_7689491fe4377a8090576a799a"`,
    );
    await queryRunner.query(`DROP TABLE "posts"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_259bf9825d9d198608d1b46b0b"`,
    );
    await queryRunner.query(`DROP TABLE "comments"`);
  }
}
