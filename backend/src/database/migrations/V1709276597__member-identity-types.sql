alter table "memberIdentities"
    add column type varchar(255);

alter table "memberIdentities"
    rename column username to value;

update "memberIdentities"
set type = 'username';

alter table "memberIdentities"
    alter column type set not null;