create table public."activityRelations" (
    "activityId" uuid not null primary key,
    "memberId" uuid not null,
    "organizationId" uuid,
    "createdAt" timestamp with time zone default now() not null,
    "updatedAt" timestamp with time zone default now() not null,
    primary key ("activityId"),
    foreign key ("activityId") references activities (id) on delete cascade,
);
create index "ix_activityRelations_memberId" on "activityRelations"("memberId");
create index "ix_activityRelations_organizationId" on "activityRelations"("organizationId");


DO
$$
DECLARE
    batch_size INT := 100000;
    offset INT := 0;
    total_processed INT := 0;
    rows_inserted INT;
BEGIN
    LOOP
        WITH inserted_rows AS (
            INSERT INTO "activityRelations" ("activityId", "memberId", "organizationId")
            SELECT id, "memberId", "organizationId"
            FROM activities
            ORDER BY id
            LIMIT batch_size OFFSET offset
            RETURNING 1
        )
        SELECT COUNT(*) INTO rows_inserted FROM inserted_rows;

        total_processed := total_processed + rows_inserted;

        RAISE NOTICE 'Batch processed: % rows. Total processed: % rows.', rows_inserted, total_processed;

        EXIT WHEN rows_inserted = 0;

        offset := offset + batch_size;
    END LOOP;

    RAISE NOTICE 'All rows processed. Total rows inserted: %.', total_processed;
END
$$;
