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
                                    insert into "memberIdentities"("memberId", platform, value, type, "tenantId", verified)
                                    values (member_row.id, 'integration_or_enrichment', email, 'email', member_row."tenantId", true)
                                    on conflict do nothing;
                                else
                                    -- if member was enriched before January 1st emails that were set are not reliable
                                    raise notice 'inserting enriched member (%) identity email "%" that is not verified', member_row.id, email;
                                    insert into "memberIdentities"("memberId", platform, value, type, "tenantId", verified)
                                    values (member_row.id, 'integration_or_enrichment', email, 'email', member_row."tenantId", false)
                                    on conflict do nothing;
                                end if;
                            else
                                -- member is not enriched -> emails came from integrations and are verified
                                raise notice 'inserting member (%) identity email "%" that is verified', member_row.id, email;
                                insert into "memberIdentities"("memberId", platform, value, type, "tenantId", verified)
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
                        insert into "memberIdentities"("memberId", platform, value, type, "tenantId", verified)
                        values (member_row.id, (identity ->> 'platform'), (identity ->> 'username'), 'username', member_row."tenantId", false)
                        on conflict do nothing;
                    end loop;
            end loop;
    end;
$$;

-- fix mergeActions
do
$$
    declare
        rec           record;
        updated_jsonb jsonb;
        identity      jsonb;
        email         text;
    begin
        for rec in select "id", "unmergeBackup"
                   from "mergeActions"
                   where type = 'member'
                     and "unmergeBackup" is not null
            loop
                -- Initialize the updated JSONB structure
                updated_jsonb := rec."unmergeBackup";
                -- clean emails, username and identities
                select jsonb_set(updated_jsonb, array ['primary'], (updated_jsonb -> 'primary') - 'emails')
                into updated_jsonb;
                select jsonb_set(updated_jsonb, array ['primary'], (updated_jsonb -> 'primary') - 'username')
                into updated_jsonb;
                select jsonb_set(updated_jsonb, array ['primary', 'identities'], jsonb_build_array())
                into updated_jsonb;
                select jsonb_set(updated_jsonb, array ['secondary'], (updated_jsonb -> 'secondary') - 'emails')
                into updated_jsonb;
                select jsonb_set(updated_jsonb, array ['secondary'], (updated_jsonb -> 'secondary') - 'username')
                into updated_jsonb;
                select jsonb_set(updated_jsonb, array ['secondary', 'identities'], jsonb_build_array())
                into updated_jsonb;

                -- now move identities with a new format into the update_jsonb identities
                for identity in select jsonb_array_elements(rec."unmergeBackup" -> 'primary' -> 'identities')
                    loop
                        updated_jsonb := jsonb_set(
                                updated_jsonb,
                                array ['primary', 'identities'],
                                (updated_jsonb -> 'primary' -> 'identities') || jsonb_build_object(
                                        'memberId', identity -> 'memberId',
                                        'platform', identity -> 'platform',
                                        'sourceId', identity -> 'sourceId',
                                        'tenantId', identity -> 'tenantId',
                                        'value', identity -> 'username',
                                        'type', 'username',
                                        'verified', true,
                                        'createdAt', identity -> 'createdAt',
                                        'updatedAt', identity -> 'updatedAt',
                                        'integrationId', identity -> 'integrationId')
                                         );
                    end loop;

                for identity in select jsonb_array_elements(rec."unmergeBackup" -> 'secondary' -> 'identities')
                    loop
                        updated_jsonb := jsonb_set(
                                updated_jsonb,
                                array ['secondary', 'identities'],
                                (updated_jsonb -> 'secondary' -> 'identities') || jsonb_build_object(
                                        'memberId', identity -> 'memberId',
                                        'platform', identity -> 'platform',
                                        'sourceId', identity -> 'sourceId',
                                        'tenantId', identity -> 'tenantId',
                                        'value', identity -> 'username',
                                        'type', 'username',
                                        'verified', true,
                                        'createdAt', identity -> 'createdAt',
                                        'updatedAt', identity -> 'updatedAt',
                                        'integrationId', identity -> 'integrationId')
                                         );
                    end loop;

                -- now also move emails as unverified identities
                for email in select jsonb_array_elements_text(rec."unmergeBackup" -> 'primary' -> 'emails')
                    loop
                        updated_jsonb := jsonb_set(
                                updated_jsonb,
                                array ['primary', 'identities'],
                                (updated_jsonb -> 'primary' -> 'identities') || jsonb_build_object(
                                        'memberId', (rec."unmergeBackup" -> 'primary') ->> 'id',
                                        'platform', 'unknown',
                                        'sourceId', null,
                                        'tenantId', (rec."unmergeBackup" -> 'primary') ->> 'tenantId',
                                        'value', email,
                                        'type', 'email',
                                        'verified', false,
                                        'createdAt', to_jsonb(now()),
                                        'updatedAt', to_jsonb(now()),
                                        'integrationId', null)
                                         );
                    end loop;
                for email in select jsonb_array_elements_text(rec."unmergeBackup" -> 'secondary' -> 'emails')
                    loop
                        updated_jsonb := jsonb_set(
                                updated_jsonb,
                                array ['secondary', 'identities'],
                                (updated_jsonb -> 'secondary' -> 'identities') || jsonb_build_object(
                                        'memberId', (rec."unmergeBackup" -> 'secondary') ->> 'id',
                                        'platform', 'unknown',
                                        'sourceId', null,
                                        'tenantId', (rec."unmergeBackup" -> 'secondary') ->> 'tenantId',
                                        'value', email,
                                        'type', 'email',
                                        'verified', false,
                                        'createdAt', to_jsonb(now()),
                                        'updatedAt', to_jsonb(now()),
                                        'integrationId', null)
                                         );
                    end loop;

                update "mergeActions" set "unmergeBackup" = updated_jsonb where id = rec.id;
            end loop;
    end
$$;