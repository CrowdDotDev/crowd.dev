CREATE TABLE IF NOT EXISTS "criticalityScores"
(
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(255) NOT NULL,
    repoUrl     VARCHAR(1024) NOT NULL,
    score       DOUBLE PRECISION NOT NULL,
    rank        INTEGER,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

create index "ix_criticality_scores_updatedAt_id" on "categories" ("updatedAt", id);

ALTER PUBLICATION sequin_pub ADD TABLE "criticalityScores";
ALTER TABLE public."criticalityScores" REPLICA IDENTITY FULL;
