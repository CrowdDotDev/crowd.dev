
-- Add unique constraint on insightsProjects.slug
ALTER TABLE "insightsProjects"
ADD CONSTRAINT unique_insights_projects_slug UNIQUE (slug);

-- FK on securityInsightsEvaluations
ALTER TABLE "securityInsightsEvaluations"
ADD CONSTRAINT fk_insights_projects_evaluations_project_slug
FOREIGN KEY ("insightsProjectSlug")
REFERENCES "insightsProjects"("slug")
ON UPDATE CASCADE
ON DELETE RESTRICT;

-- FK on securityInsightsEvaluationSuites
ALTER TABLE "securityInsightsEvaluationSuites"
ADD CONSTRAINT fk_insights_projects_suites_project_slug
FOREIGN KEY ("insightsProjectSlug")
REFERENCES "insightsProjects"("slug")
ON UPDATE CASCADE
ON DELETE RESTRICT;

-- FK on securityInsightsEvaluationAssessments
ALTER TABLE "securityInsightsEvaluationAssessments"
ADD CONSTRAINT fk_insights_projects_assessments_project_slug
FOREIGN KEY ("insightsProjectSlug")
REFERENCES "insightsProjects"("slug")
ON UPDATE CASCADE
ON DELETE RESTRICT;
