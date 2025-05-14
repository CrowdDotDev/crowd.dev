ALTER PUBLICATION sequin_pub ADD TABLE "memberIdentities";
ALTER PUBLICATION sequin_pub ADD TABLE "integrations";
ALTER TABLE public."memberIdentities" REPLICA IDENTITY FULL;
ALTER TABLE public."integrations" REPLICA IDENTITY FULL;

create index "ix_memberIdentities_updatedAt_id" on "memberIdentities" ("updatedAt", id);
create index "ix_integrations_updatedAt_id" on "integrations" ("updatedAt", id);