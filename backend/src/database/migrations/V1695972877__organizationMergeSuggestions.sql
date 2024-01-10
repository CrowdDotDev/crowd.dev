create table
    public."organizationToMerge" (
        "createdAt" timestamp
        with
            time zone not null,
            "updatedAt" timestamp
        with
            time zone not null,
            "organizationId" uuid not null references public.organizations on update cascade on delete cascade,
            "toMergeId" uuid not null references public.organizations on update cascade on delete cascade,
            similarity double precision,
            primary key ("organizationId", "toMergeId")
    );

create index "ix_organizationToMerge_toMergeId" on public."organizationToMerge" ("toMergeId");

create table
    public."organizationNoMerge" (
        "createdAt" timestamp
        with
            time zone not null,
            "updatedAt" timestamp
        with
            time zone not null,
            "organizationId" uuid not null references public.organizations on update cascade on delete cascade,
            "noMergeId" uuid not null references public.organizations on update cascade on delete cascade,
            primary key ("organizationId", "noMergeId")
    );

create index "ix_organizationNoMerge_noMergeId" on public."organizationNoMerge" ("noMergeId");