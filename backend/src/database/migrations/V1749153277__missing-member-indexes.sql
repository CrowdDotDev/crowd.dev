create index concurrently "ix_activityRelations_objectMemberId"
    on "activityRelations" ("objectMemberId") where "objectMemberId" is not null;

create index concurrently if not exists "ix_memberOrganizations_memberId"
    on "memberOrganizations" ("memberId");