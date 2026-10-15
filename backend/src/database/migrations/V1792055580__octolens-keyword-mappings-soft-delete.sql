ALTER TABLE integration."octolensKeywordMappings"
    ADD COLUMN IF NOT EXISTS "deactivatedAt" TIMESTAMPTZ NULL,
    ADD COLUMN IF NOT EXISTS "lastSeenAt" TIMESTAMPTZ NOT NULL DEFAULT now();
