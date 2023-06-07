ALTER TABLE public."activities" ADD COLUMN "organizationId" uuid;

ALTER TABLE public."activities" ADD FOREIGN KEY ("organizationId") REFERENCES organizations(id);

UPDATE activities
SET "organizationId" = (
    SELECT mo."organizationId"
    FROM "memberOrganizations" AS mo
    WHERE mo."memberId" = activities."memberId"
    ORDER BY mo."createdAt" DESC
    LIMIT 1
);