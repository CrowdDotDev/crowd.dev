create table "organizationIdentities" (
    "organizationId" uuid not null references organizations on delete cascade,
    platform text not null,
    name text not null,
    "sourceId" text,
    "url" text,
    "tenantId" uuid not null references tenants on delete cascade,
    "integrationId" uuid,
    "createdAt" timestamp with time zone default now() not null,
    "updatedAt" timestamp with time zone default now() not null,
    primary key ("organizationId", platform, name),
    unique (platform, name, "tenantId")
);
create index "ix_organizationIdentities" on "organizationIdentities" (platform, name, "organizationId");
create index "ix_organizationIdentities_tenantId" on "organizationIdentities" ("tenantId");
create index "ix_organizationIdentities_organizationId" on "organizationIdentities" ("organizationId");
create index "organizationIdentities_createdAt_index" on "organizationIdentities" ("createdAt" desc);
create index "organizationIdentities_name_index" on "organizationIdentities" (name);
create trigger organization_identities_updated_at before
update on "organizationIdentities" for each row execute procedure trigger_set_updated_at();


alter table organizations
    add "weakIdentities" jsonb default '[]'::jsonb not null;

BEGIN;
DO
$$
    DECLARE
        org organizations%ROWTYPE;
        act activities%ROWTYPE;
        gin integrations%ROWTYPE;
    BEGIN
        FOR org IN SELECT * FROM organizations
            LOOP
                -- check for organization activity on github
                SELECT INTO act * FROM activities WHERE "platform" = 'github' AND "organizationId" = org.id LIMIT 1;
                BEGIN
                    -- If activity is found
                    IF FOUND THEN
                        SELECT INTO gin *
                        FROM integrations
                        WHERE "platform" = 'github'
                          AND "tenantId" = org."tenantId"
                          AND "deletedAt" IS NULL
                        LIMIT 1;
                        -- If integration is found
                        IF FOUND THEN
                            INSERT INTO "organizationIdentities" ("organizationId", "platform", "name", "url",
                                                                  "sourceId", "integrationId", "tenantId")
                            VALUES (org.id, 'github', org.name, org.url, null, gin.id, org."tenantId");
                            -- If integration is not found, `platform` is set to 'custom' and `integrationId` is set to null
                        ELSE
                            INSERT INTO "organizationIdentities" ("organizationId", "platform", "name", "sourceId",
                                                                  "integrationId", "tenantId")
                            VALUES (org.id, 'custom', org.name, null, null, org."tenantId");
                        END IF;
                        -- If no activity is found, `platform` is set to 'custom' and `integrationId` is set to null
                    ELSE
                        INSERT INTO "organizationIdentities" ("organizationId", "platform", "name", "sourceId",
                                                              "integrationId", "tenantId")
                        VALUES (org.id, 'custom', org.name, null, null, org."tenantId");
                    END IF;
                EXCEPTION
                    WHEN unique_violation THEN
                        -- If conflict happens, insert this identity into organizations."weakIdentities" jsonb array
                        UPDATE organizations
                        SET "weakIdentities" = COALESCE("weakIdentities", '{}'::jsonb) ||
                                               jsonb_build_object('platform', 'github', 'name', org.name)
                        WHERE id = org.id;
                END;

                -- check for non-null LinkedIn handle
                IF org.linkedin -> 'handle' IS NOT NULL THEN
                    BEGIN
                        INSERT INTO "organizationIdentities" ("organizationId", "platform", "name", "sourceId",
                                                              "integrationId", "tenantId", "url")
                        VALUES (org.id, 'linkedin', replace(org.linkedin ->> 'handle', 'company/', ''), null, null,
                                org."tenantId", CONCAT('https://linkedin.com/company/',
                                                       replace(org.linkedin ->> 'handle', 'company/', '')));
                    EXCEPTION
                        WHEN unique_violation THEN
                            -- If conflict happens, insert this identity into organizations."weakIdentities" jsonb array
                            UPDATE organizations
                            SET "weakIdentities" = COALESCE("weakIdentities", '{}'::jsonb) ||
                                                   jsonb_build_object('platform', 'linkedin', 'name',
                                                                      replace(org.linkedin ->> 'handle', 'company/', ''),
                                                                      'url', CONCAT('https://linkedin.com/company/',
                                                                                    replace(org.linkedin ->> 'handle', 'company/', '')))
                            WHERE id = org.id;
                    END;
                END IF;

                -- check for non-null Twitter handle
                IF org.twitter -> 'handle' IS NOT NULL THEN
                    BEGIN
                        INSERT INTO "organizationIdentities" ("organizationId", "platform", "name", "sourceId",
                                                              "integrationId", "tenantId", "url")
                        VALUES (org.id, 'twitter', org.twitter ->> 'handle'::text, null, null, org."tenantId",
                                CONCAT('https://twitter.com/', org.twitter ->> 'handle'::text));
                    EXCEPTION
                        WHEN unique_violation THEN
                            -- If conflict happens, insert this identity into organizations."weakIdentities" jsonb array
                            UPDATE organizations
                            SET "weakIdentities" = COALESCE("weakIdentities", '{}'::jsonb) ||
                                                   jsonb_build_object('platform', 'twitter', 'name',
                                                                      org.twitter ->> 'handle', 'url',
                                                                      CONCAT('https://twitter.com/', org.twitter ->> 'handle'::text))
                            WHERE id = org.id;
                    END;
                END IF;
            END LOOP;
    END ;
$$;

COMMIT;


drop index if exists "organizations_name_tenant_id";

alter table organizations DROP COLUMN "name";

alter table organizations DROP COLUMN "url";
