alter table "memberSegmentAffiliations"
    add column if not exists "verified" boolean not null default true,
    add column if not exists "verifiedBy" varchar(255) default null;
