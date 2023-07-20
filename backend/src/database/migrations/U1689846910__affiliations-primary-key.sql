ALTER TABLE "memberOrganizations" DROP CONSTRAINT "memberOrganizations_pkey";
ALTER TABLE "memberOrganizations" DROP COLUMN "id";
DROP INDEX "memberOrganizations_unique";

DELETE
FROM "memberOrganizations"
WHERE ctid NOT IN (
    SELECT MIN(ctid)
    FROM "memberOrganizations"
    GROUP BY "memberId", "organizationId"
);

ALTER TABLE "memberOrganizations" ADD PRIMARY KEY ("memberId", "organizationId");

