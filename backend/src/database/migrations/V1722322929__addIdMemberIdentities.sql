ALTER TABLE "memberIdentities" ADD COLUMN "id" UUID NOT NULL DEFAULT uuid_generate_v4();
ALTER TABLE "memberIdentities" DROP CONSTRAINT "memberIdentities_pkey";
ALTER TABLE "memberIdentities" ADD PRIMARY KEY (id);
