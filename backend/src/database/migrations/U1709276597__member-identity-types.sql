alter table "memberIdentities"
    drop column type;

alter table "memberIdentities"
    rename column value to username;