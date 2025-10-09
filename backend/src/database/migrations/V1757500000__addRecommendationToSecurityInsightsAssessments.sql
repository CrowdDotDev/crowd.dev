-- Add additional columns to securityInsightsEvaluationAssessments table
ALTER TABLE public."securityInsightsEvaluationAssessments" 
ADD COLUMN "recommendation" text,
ADD COLUMN "start" text,
ADD COLUMN "end" text,
ADD COLUMN "value" jsonb,
ADD COLUMN "changes" jsonb;