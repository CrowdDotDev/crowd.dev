ALTER TABLE "segments" ADD COLUMN IF NOT EXISTS "parentId" uuid;
ALTER TABLE "segments" ADD COLUMN IF NOT EXISTS "grandparentId" uuid;
ALTER TABLE "segments" ADD COLUMN "type" TEXT GENERATED ALWAYS AS (
        CASE
            WHEN "parentSlug" IS NULL AND "grandparentSlug" IS NULL THEN 'projectGroup'
            WHEN "grandparentSlug" IS NULL AND "parentSlug" IS NOT NULL THEN 'project'
            ELSE 'subproject' 
        END
    ) STORED;


DO
$$
    DECLARE
        segment segments%ROWTYPE;
        parent segments%ROWTYPE;
        grandparent segments%ROWTYPE;
    BEGIN
        FOR segment IN SELECT * FROM segments
            LOOP
                IF segment."type" = 'project' THEN
                    SELECT * INTO parent
                    FROM segments
                    WHERE "slug" = segment."parentSlug"
                    AND "type" = 'projectGroup';

                    UPDATE segments
                    SET "parentId" = parent.id
                    WHERE id = segment.id;


                ELSIF segment."type" = 'subproject' THEN
                    SELECT * INTO parent
                    FROM segments
                    WHERE "slug" = segment."parentSlug"
                    AND "type" = 'project';

                    SELECT * INTO grandparent
                    FROM segments
                    WHERE "slug" = segment."grandparentSlug"
                    AND "type" = 'projectGroup';

                    UPDATE segments
                    SET "parentId" = parent.id,
                        "grandparentId" = grandparent.id
                    WHERE id = segment.id;
                    
                END IF;
            END LOOP;
    END ;
$$;

COMMIT;


create index "segments_parent_id"
    on public.segments ("parentId");


create index "segments_grandparent_id"
    on public.segments ("grandparentId");

create index "segments_type"
    on public.segments ("type");