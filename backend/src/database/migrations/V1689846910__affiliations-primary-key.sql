ALTER TABLE "memberOrganizations" DROP CONSTRAINT "memberOrganizations_pkey";
ALTER TABLE "memberOrganizations" ADD COLUMN "id" UUID NOT NULL DEFAULT uuid_generate_v4();
ALTER TABLE "memberOrganizations" ADD PRIMARY KEY (id);
ALTER TABLE "memberOrganizations" ADD UNIQUE ("memberId", "organizationId", "dateStart", "dateEnd");

