alter table "memberIdentities"
    drop constraint "memberIdentities_pkey";

alter table "memberIdentities"
    add primary key ("memberId", platform, value, type);