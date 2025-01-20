create table "memberOrganizationAffiliationOverrides" (
    id uuid not null,
    "memberId" uuid not null,
    "organizationId"      uuid not null,
    "allowAffiliation"    boolean,
    "isPrimaryOrganization" boolean,

    primary key ("id"),
    foreign key ("organizationId") references "organizations" (id),
    foreign key ("memberId") references members (id),
    unique ("memberId", "organizationId")
);


create index "ix_memberOrganizationAffiliationOverrides_memberId" on "memberOrganizationAffiliationOverrides"("memberId");