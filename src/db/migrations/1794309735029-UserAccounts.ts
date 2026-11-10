import { MigrationInterface, QueryRunner } from 'typeorm';

export class UserAccounts1794309735029 implements MigrationInterface {
  name = 'UserAccounts1794309735029';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "security_devices" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "user_id" uuid NOT NULL, "device_id" character varying(255) NOT NULL, "ip" character varying(45) NOT NULL, "title" character varying(255) NOT NULL, "last_active_date" integer NOT NULL, "expiration_date" TIMESTAMP WITH TIME ZONE NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_1a2707b89afb452a5ca4e6c8883" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_6143ad1ef6f122d933239d3b05" ON "security_devices"  ("user_id") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "idx_security_devices_device_id_unique" ON "security_devices"  ("device_id") WHERE "deleted_at" IS NULL`,
    );
    await queryRunner.query(
      `CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "login" character varying(10) NOT NULL, "password_hash" character varying(255) NOT NULL, "email" character varying(255) NOT NULL, "first_name" character varying(255), "last_name" character varying(255), "email_confirmation_code" character varying(255), "email_confirmation_expiration_date" TIMESTAMP WITH TIME ZONE, "email_is_confirmed" boolean NOT NULL DEFAULT false, "password_recovery_code" character varying(255), "password_recovery_expiration_date" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c5d8de2fa1ff019db635ee1678" ON "users"  ("email_confirmation_code") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f2cb9c494631adf6edcc4893a2" ON "users"  ("password_recovery_code") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "idx_users_email_unique" ON "users"  ("email") WHERE "deleted_at" IS NULL`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "idx_users_login_unique" ON "users"  ("login") WHERE "deleted_at" IS NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "security_devices" ADD CONSTRAINT "FK_6143ad1ef6f122d933239d3b050" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "security_devices" DROP CONSTRAINT "FK_6143ad1ef6f122d933239d3b050"`,
    );
    await queryRunner.query(`DROP INDEX "public"."idx_users_login_unique"`);
    await queryRunner.query(`DROP INDEX "public"."idx_users_email_unique"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_f2cb9c494631adf6edcc4893a2"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_c5d8de2fa1ff019db635ee1678"`,
    );
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(
      `DROP INDEX "public"."idx_security_devices_device_id_unique"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_6143ad1ef6f122d933239d3b05"`,
    );
    await queryRunner.query(`DROP TABLE "security_devices"`);
  }
}
