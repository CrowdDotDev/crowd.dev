create index if not exists "ix_activities_organizationId" on activities ("organizationId");
create index if not exists "ix_segments_tenantId" on segments ("tenantId");
create index if not exists "ix_memberSegments_segmentId" on "memberSegments" ("segmentId");
create index if not exists "ix_memberSegments_tenantId" on "memberSegments" ("tenantId");
create index if not exists "ix_organizationSegments_tenantId" on "organizationSegments" ("tenantId");
create index if not exists "ix_organizationSegments_segmentId" on "organizationSegments" ("segmentId");
create index if not exists "ix_memberSegmentAffiliations_organizationId" on "memberSegmentAffiliations" ("organizationId");
create index if not exists "ix_memberSegmentAffiliations_segmentId" on "memberSegmentAffiliations" ("segmentId");
