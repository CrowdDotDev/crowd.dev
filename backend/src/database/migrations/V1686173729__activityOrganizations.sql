ALTER TABLE public."activities" ADD COLUMN "organizationId" uuid;

ALTER TABLE public."activities" ADD FOREIGN KEY ("organizationId") REFERENCES organizations(id);

ALTER TABLE public."memberSegments" ADD COLUMN "affiliatedOrganizationId" uuid;

ALTER TABLE public."memberSegments" ADD FOREIGN KEY ("affiliatedOrganizationId") REFERENCES organizations(id) ON DELETE SET NULL;

UPDATE activities
SET "organizationId" = (
    SELECT mo."organizationId"
    FROM "memberOrganizations" AS mo
    WHERE mo."memberId" = activities."memberId"
    ORDER BY mo."createdAt" DESC
    LIMIT 1
);