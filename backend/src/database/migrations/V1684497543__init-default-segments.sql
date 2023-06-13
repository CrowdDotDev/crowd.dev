
INSERT INTO segments
    (id, name, "parentName", "grandparentName", slug, "parentSlug", "grandparentSlug", description, "sourceId", "sourceParentId", "tenantId")
SELECT
    -- this thing generates a valid uuidv4 without `uuid-ossp` extension: https://stackoverflow.com/a/21327318
    uuid_in(overlay(overlay(md5(random()::text || ':' || random()::text) placing '4' from 13) placing to_hex(floor(random()*(11-8+1) + 8)::int)::text from 17)::cstring),
    'Default', -- name
    'Default', -- parentName
    'Default', -- grandparentName
    'default', -- slug
    'default', -- parentSlug
    'default', -- grandparentSlug
    NULL, -- description
    NULL, -- sourceId
    NULL, -- sourceParentId
    t.id -- tenantId
FROM tenants t
LEFT JOIN segments s ON s."tenantId" = t.id
WHERE s.id IS NULL;

UPDATE activities SET "segmentId" = s.id FROM segments s WHERE s."tenantId" = activities."tenantId";
UPDATE integrations SET "segmentId" = s.id FROM segments s WHERE s."tenantId" = integrations."tenantId";
UPDATE conversations SET "segmentId" = s.id FROM segments s WHERE s."tenantId" = conversations."tenantId";
UPDATE tags SET "segmentId" = s.id FROM segments s WHERE s."tenantId" = tags."tenantId";
UPDATE tasks SET "segmentId" = s.id FROM segments s WHERE s."tenantId" = tasks."tenantId";
UPDATE reports SET "segmentId" = s.id FROM segments s WHERE s."tenantId" = reports."tenantId";
UPDATE widgets SET "segmentId" = s.id FROM segments s WHERE s."tenantId" = widgets."tenantId";

INSERT INTO "memberSegments" ("memberId", "segmentId", "tenantId")
SELECT
    m.id,
    s.id,
    m."tenantId"
FROM members m
JOIN segments s ON s."tenantId" = m."tenantId";

INSERT INTO "organizationSegments" ("organizationId", "segmentId", "tenantId")
SELECT
    o.id,
    s.id,
    o."tenantId"
FROM organizations o
JOIN segments s ON s."tenantId" = o."tenantId";

UPDATE "memberToMerge" mtm
SET "segmentId" = s.id
FROM segments s
JOIN "memberSegments" ms ON ms."segmentId" = s.id
WHERE ms."memberId" = mtm."memberId";

UPDATE "memberNoMerge" mnm
SET "segmentId" = s.id
FROM segments s
JOIN "memberSegments" ms ON ms."segmentId" = s.id
WHERE ms."memberId" = mnm."memberId";
