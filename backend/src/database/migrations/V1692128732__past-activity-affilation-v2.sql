WITH new_activities_organizations AS (
    SELECT
        a.id,
        (ARRAY_REMOVE(ARRAY_AGG(CASE WHEN msa.id IS NULL THEN '00000000-0000-0000-0000-000000000000' ELSE msa."organizationId" END), '00000000-0000-0000-0000-000000000000')
             || ARRAY_REMOVE(ARRAY_AGG(mo."organizationId" ORDER BY mo."dateStart" DESC, mo.id), NULL)
             || ARRAY_REMOVE(ARRAY_AGG(mo1."organizationId" ORDER BY mo1."createdAt" DESC, mo1.id), NULL)
            || ARRAY[a."organizationId"])[1] AS new_org
    FROM activities a
    LEFT JOIN "memberSegmentAffiliations" msa ON msa."memberId" = a."memberId" AND a."segmentId" = msa."segmentId"
    LEFT JOIN "memberOrganizations" mo ON mo."memberId" = a."memberId" AND (
            a.timestamp BETWEEN mo."dateStart" AND mo."dateEnd"
            OR (a.timestamp >= mo."dateStart" AND mo."dateEnd" IS NULL)
        )
    LEFT JOIN "memberOrganizations" mo1 ON mo1."memberId" = a."memberId" AND mo1."createdAt" <= a.timestamp
    GROUP BY a.id
)
UPDATE activities a1
SET "organizationId" = nao.new_org
FROM new_activities_organizations nao
WHERE a1.id = nao.id
  AND ("organizationId" != nao.new_org
    OR ("organizationId" IS NULL AND nao.new_org IS NOT NULL)
    OR ("organizationId" IS NOT NULL AND nao.new_org IS NULL));
