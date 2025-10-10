-- Rollback: Remove additional columns from securityInsightsEvaluationAssessments table
ALTER TABLE public."securityInsightsEvaluationAssessments" 
DROP COLUMN "recommendation",
DROP COLUMN "start",
DROP COLUMN "end",
DROP COLUMN "value",
DROP COLUMN "changes";