DROP INDEX IF EXISTS "ix_criticality_scores_updatedAt_id";

ALTER PUBLICATION sequin_pub DROP TABLE "criticalityScores";

DROP TABLE IF EXISTS "criticalityScores";
