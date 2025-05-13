create index "ix_categories_updatedAt_id" on "categories" ("updatedAt", id);
create index "ix_categoryGroups_updatedAt_id" on "categoryGroups" ("updatedAt", id);

ALTER PUBLICATION sequin_pub ADD TABLE "categories";
ALTER PUBLICATION sequin_pub ADD TABLE "categoryGroups";
ALTER TABLE public."categories" REPLICA IDENTITY FULL;
ALTER TABLE public."categoryGroups" REPLICA IDENTITY FULL;
