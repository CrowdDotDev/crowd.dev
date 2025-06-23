create index "ix_maintainersInternal_updatedAt_id" on "maintainersInternal" ("updatedAt", id);

ALTER PUBLICATION sequin_pub ADD TABLE "maintainersInternal";
ALTER TABLE public."maintainersInternal" REPLICA IDENTITY FULL;
