create table public."activityRelations" (
    "activityId" uuid not null primary key,
    "memberId" uuid not null,
    "organizationId" uuid,
    "createdAt" timestamp with time zone default now() not null,
    "updatedAt" timestamp with time zone default now() not null,
    foreign key ("memberId") references members (id) on delete cascade,
    foreign key ("organizationId") references organizations (id) on delete cascade,
    unique ("activityId", "memberId", "organizationId")
);
create index "ix_activityRelations_memberId" on "activityRelations"("memberId");
create index "ix_activityRelations_organizationId" on "activityRelations"("organizationId");


DO
$$
DECLARE
    batch_size INT := 100000;
    last_processed_id UUID := '00000000-0000-0000-0000-000000000000';
    total_processed INT := 0;
    rows_inserted INT;
BEGIN
    LOOP
        INSERT INTO "activityRelations" ("activityId", "memberId", "organizationId")
        SELECT id, "memberId", "organizationId"
        FROM activities
        WHERE id > last_processed_id
        ORDER BY id
        LIMIT batch_size;

        GET DIAGNOSTICS rows_inserted = ROW_COUNT;

        total_processed := total_processed + rows_inserted;
        RAISE NOTICE 'Batch processed: % rows. Total processed: % rows.', rows_inserted, total_processed;

        EXIT WHEN rows_inserted = 0;

        SELECT MAX(id) INTO last_processed_id FROM activities WHERE id > last_processed_id;

    END LOOP;

    RAISE NOTICE 'All rows processed. Total rows inserted: %.', total_processed;
END
$$;
