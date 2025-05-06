ALTER PUBLICATION sequin_pub DROP TABLE "securityInsightsEvaluationSuiteControlEvaluations";
ALTER PUBLICATION sequin_pub DROP TABLE "securityInsightsEvaluationSuiteControlEvaluationAssessments";

ALTER TABLE "securityInsightsEvaluationSuiteControlEvaluations" RENAME TO "securityInsightsEvaluations";
ALTER TABLE "securityInsightsEvaluationSuiteControlEvaluationAssessments" RENAME TO "securityInsightsEvaluationAssessments";
ALTER TABLE "securityInsightsEvaluationAssessments" RENAME COLUMN "securityInsightsEvaluationSuiteControlEvaluationId" TO "securityInsightsEvaluationId";

ALTER PUBLICATION sequin_pub ADD TABLE "securityInsightsEvaluations";
ALTER PUBLICATION sequin_pub ADD TABLE "securityInsightsEvaluationAssessments";
ALTER TABLE public."securityInsightsEvaluations" REPLICA IDENTITY FULL;
ALTER TABLE public."securityInsightsEvaluationAssessments" REPLICA IDENTITY FULL;