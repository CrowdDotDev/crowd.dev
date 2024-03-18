alter table "memberIdentities"
    add column type         varchar(255),
    add column "isVerified" boolean not null default true;

alter table "memberIdentities"
    rename column username to value;

update "memberIdentities"
set type = 'username';
 
alter table "memberIdentities"
    alter column type set not null;

alter table "memberIdentities"
    drop constraint "memberIdentities_platform_username_tenantId_key";

drop index if exists "memberIdentities_platform_username_tenantId_key";
create unique index if not exists "uix_memberIdentities_platform_value_type_tenantId_isVerified" on "memberIdentities" (platform, value, type, "tenantId", "isVerified") where "isVerified" = true;

alter table members
    rename column emails to "oldEmails";

alter table members
    rename column "weakIdentities" to "oldWeakIdentities";

-- move emails to identities
do
$$
    declare
        member_row members%rowtype;
        email      text;
    begin
        for member_row in select * from members where cardinality("oldEmails") > 0
            loop
                foreach email in array member_row."oldEmails"
                    loop
                        if email is not null then
                            if member_row."lastEnriched" is not null then
                                if member_row."lastEnriched" > '2024-01-01 00:01:00 +00:00'::timestamptz then
                                    -- if it was enriched after January 1st emails that were set are reliable
                                    raise notice 'inserting enriched member (%) identity email "%" that is verified', member_row.id, email;
                                    insert into "memberIdentities"("memberId", platform, value, type, "tenantId", "isVerified")
                                    values (member_row.id, 'integration_or_enrichment', email, 'email', member_row."tenantId", true)
                                    on conflict do nothing;
                                else
                                    -- if member was enriched before January 1st emails that were set are not reliable
                                    raise notice 'inserting enriched member (%) identity email "%" that is not verified', member_row.id, email;
                                    insert into "memberIdentities"("memberId", platform, value, type, "tenantId", "isVerified")
                                    values (member_row.id, 'integration_or_enrichment', email, 'email', member_row."tenantId", false)
                                    on conflict do nothing;
                                end if;
                            else
                                -- member is not enriched -> emails came from integrations and are verified
                                raise notice 'inserting member (%) identity email "%" that is verified', member_row.id, email;
                                insert into "memberIdentities"("memberId", platform, value, type, "tenantId", "isVerified")
                                values (member_row.id, 'integration', email, 'email', member_row."tenantId", true)
                                on conflict do nothing;
                            end if;
                        end if;
                    end loop;
            end loop;
    end;
$$;

-- move weak identities to unverified identities
do
$$
    declare
        member_row members%rowtype;
        identity   jsonb;
    begin
        for member_row in select * from members
            loop
                for identity in select jsonb_array_elements(member_row."oldWeakIdentities")
                    loop
                        raise notice 'member %, platform %, username %', member_row.id, (identity ->> 'platform'), (identity ->> 'username');
                        insert into "memberIdentities"("memberId", platform, value, type, "tenantId", "isVerified")
                        values (member_row.id, (identity ->> 'platform'), (identity ->> 'username'), 'username', member_row."tenantId", false)
                        on conflict do nothing;
                    end loop;
            end loop;
    end;
$$;