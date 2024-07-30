ALTER TABLE "memberIdentities" DROP COLUMN "id";
ALTER TABLE "memberIdentities" DROP CONSTRAINT "memberIdentities_pkey";
ALTER TABLE "memberIdentities" ADD PRIMARY KEY ("memberId", platform, username);
