INSERT INTO "organizationSegments" ("organizationId", "segmentId", "tenantId")
SELECT
    mo."organizationId",
    ms."segmentId",
    ms."tenantId"
FROM "memberOrganizations" mo
JOIN members m ON mo."memberId" = m.id
JOIN "memberSegments" ms ON ms."memberId" = m.id
LEFT JOIN "organizationSegments" os ON os."organizationId" = mo."organizationId"
WHERE os."segmentId" IS NULL
ON CONFLICT DO NOTHING;
