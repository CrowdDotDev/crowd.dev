ALTER PUBLICATION sequin_pub ADD TABLE "lfxMemberships";
ALTER TABLE public."lfxMemberships" REPLICA IDENTITY FULL;

create index "ix_lfxMemberships_updatedAt_id" on "lfxMemberships" ("updatedAt", id);