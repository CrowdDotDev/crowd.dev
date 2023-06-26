ALTER TABLE public."activities" ADD COLUMN "organizationId" uuid;

ALTER TABLE public."activities" ADD FOREIGN KEY ("organizationId") REFERENCES organizations(id);

create table "memberSegmentAffiliations" (
    id uuid not null,
    "memberId" uuid not null,
    "segmentId" uuid not null,
    "organizationId" uuid,
    constraint "memberSegmentAffiliations_pkey" primary key (id),
    foreign key ("memberId") references members (id) on delete cascade,
    foreign key ("segmentId") references segments (id) on delete cascade,
    foreign key ("organizationId") references organizations (id) on delete cascade,
    unique("memberId", "segmentId")
);

UPDATE activities
SET "organizationId" = (
    SELECT mo."organizationId"
    FROM "memberOrganizations" AS mo
    JOIN "organizationSegments" os on os."organizationId" = mo."organizationId"
    WHERE mo."memberId" = activities."memberId"
    and os."segmentId" = activities."segmentId"
    ORDER BY mo."createdAt" DESC
    LIMIT 1
);