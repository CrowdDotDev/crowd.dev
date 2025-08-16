ALTER PUBLICATION sequin_pub ADD TABLE "organizationIdentities";
ALTER TABLE public."organizationIdentities" REPLICA IDENTITY FULL;

create index "ix_organizationIdentities_updatedAt_with_pk" on "organizationIdentities" ("updatedAt", "organizationId", platform, type, value);