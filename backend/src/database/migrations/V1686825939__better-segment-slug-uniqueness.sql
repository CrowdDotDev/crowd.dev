CREATE UNIQUE INDEX "segments_slug_pSlug_gpSlugNull_tenantId_idx" ON "segments" ("slug", "parentSlug", "tenantId") WHERE "grandparentSlug" IS NULL;
CREATE UNIQUE INDEX "segments_slug_pSlugNull_gpSlugNull_tenantId_idx" ON "segments" ("slug", "tenantId") WHERE "grandparentSlug" IS NULL AND "parentSlug" IS NULL;
