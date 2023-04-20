alter table members
  add column "weakIdentities" jsonb not null default '[]'::jsonb;