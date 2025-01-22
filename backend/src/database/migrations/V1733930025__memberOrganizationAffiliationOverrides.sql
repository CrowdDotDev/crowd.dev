create table "memberOrganizationAffiliationOverrides" (
    id uuid not null,
    "memberId" uuid not null,
    "memberOrganizationId"      uuid not null,
    "allowAffiliation"    boolean,
    "isPrimaryWorkExperience" boolean,

    primary key ("id"),
    foreign key ("memberOrganizationId") references "memberOrganizations" (id),
    foreign key ("memberId") references members (id),
    unique ("memberId", "memberOrganizationId")
);


create index "ix_memberOrganizationAffiliationOverrides_memberId" on "memberOrganizationAffiliationOverrides"("memberId");