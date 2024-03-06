alter table "memberIdentities"
    add column type         varchar(255),
    add column "isVerified" boolean not null default true;

alter table "memberIdentities"
    rename column username to value;

update "memberIdentities"
set type = 'username';

alter table "memberIdentities"
    alter column type set not null;


alter table members
    rename column emails to "oldEmails";

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
                        if member_row."lastEnriched" is not null then
                            if member_row."lastEnriched" > '2024-01-01 00:01:00 +00:00'::timestamptz then
                                -- if it was enriched after January 1st emails that were set are reliable
                                raise notice 'inserting enriched member (%) identity email "%" that is verified', member_row.id, email;
                                insert into "memberIdentities"("memberId", platform, value, type, "sourceId", "tenantId", "isVerified")
                                values (member_row.id, 'unknown', email, 'email', null, member_row."tenantId", true);
                            else
                                -- if member was enriched before January 1st emails that were set are not reliable
                                raise notice 'inserting enriched member (%) identity email "%" that is not verified', member_row.id, email;
                                insert into "memberIdentities"("memberId", platform, value, type, "sourceId", "tenantId", "isVerified")
                                values (member_row.id, 'unknown', email, 'email', null, member_row."tenantId", false);
                            end if;
                        else
                            -- member is not enriched -> emails came from integrations and are verified
                            raise notice 'inserting member (%) identity email "%" that is verified', member_row.id, email;
                            insert into "memberIdentities"("memberId", platform, value, type, "sourceId", "tenantId", "isVerified")
                            values (member_row.id, 'unknown', email, 'email', null, member_row."tenantId", true);
                        end if;
                    end loop;
            end loop;
    end;
$$;
