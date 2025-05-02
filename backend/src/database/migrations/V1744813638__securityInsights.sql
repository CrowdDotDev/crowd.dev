-- Security Insights Evaluation Suites
create table public."securityInsightsEvaluationSuites" (
    "id" uuid not null primary key,
    "name" text not null,
    "repo" text not null,
    "catalogId" text not null,
    "result" text not null,
    "corruptedState" boolean not null,
    "createdAt" timestamp with time zone default now() not null,
    "updatedAt" timestamp with time zone default now() not null,
    "insightsProjectId" uuid not null,
    "insightsProjectSlug" text not null,
    
    foreign key ("insightsProjectId") references "insightsProjects" (id) on delete cascade,
    unique ("repo", "catalogId")
);

create index "ix_securityInsightsEvaluationSuites_repo" on "securityInsightsEvaluationSuites"("repo");
create index "ix_securityInsightsEvaluationSuites_updatedAt_id" on "securityInsightsEvaluationSuites" ("updatedAt", id);

-- Security Insights Evaluation Suites Control Evaluations
create table public."securityInsightsEvaluationSuiteControlEvaluations" (
    "id" uuid not null primary key,
    "securityInsightsEvaluationSuiteId" uuid not null,
    "repo" text not null,
    "controlId" text not null,
    "result" text not null,
    "message" text not null,
    "corruptedState" boolean not null,
    "remediationGuide" text not null,
    "createdAt" timestamp with time zone default now() not null,
    "updatedAt" timestamp with time zone default now() not null,
    "insightsProjectId" uuid not null,
    "insightsProjectSlug" text not null,
    
    foreign key ("insightsProjectId") references "insightsProjects" (id) on delete cascade,
    foreign key ("securityInsightsEvaluationSuiteId") references "securityInsightsEvaluationSuites" (id) on delete cascade,
    unique ("securityInsightsEvaluationSuiteId", "repo", "controlId")
);

create index "ix_securityInsightsControlEvaluations_repo" on "securityInsightsEvaluationSuiteControlEvaluations"("repo");
create index "ix_securityInsightsControlEvaluations_updatedAt_id" on "securityInsightsEvaluationSuiteControlEvaluations" ("updatedAt", id);


-- Security Insights Evaluation Suites Control Evaluation Assessments
create table public."securityInsightsEvaluationSuiteControlEvaluationAssessments" (
    "id" uuid not null primary key,
    "securityInsightsEvaluationSuiteControlEvaluationId" uuid not null,
    "repo" text not null,
    "requirementId" text not null,
    "applicability" text[] not null,
    "description" text not null,
    "result" text not null,
    "message" text not null,
    "steps" text[] not null,
    "stepsExecuted" integer not null,
    "runDuration" text not null,
    "createdAt" timestamp with time zone default now() not null,
    "updatedAt" timestamp with time zone default now() not null,
    "insightsProjectId" uuid not null,
    "insightsProjectSlug" text not null,
    
    foreign key ("insightsProjectId") references "insightsProjects" (id) on delete cascade,
    foreign key ("securityInsightsEvaluationSuiteControlEvaluationId") references "securityInsightsEvaluationSuiteControlEvaluations" (id) on delete cascade,
    unique ("securityInsightsEvaluationSuiteControlEvaluationId", "repo", "requirementId")
);

create index "ix_securityInsightsAssessments_repo" on "securityInsightsEvaluationSuiteControlEvaluationAssessments"("repo");
create index "ix_securityInsightsAssessments_updatedAt_id" on "securityInsightsEvaluationSuiteControlEvaluationAssessments" ("updatedAt", id);


-- Sequin publication migrations
ALTER PUBLICATION sequin_pub ADD TABLE "securityInsightsEvaluationSuiteControlEvaluations";
ALTER PUBLICATION sequin_pub ADD TABLE "securityInsightsEvaluationSuiteControlEvaluationAssessments";
ALTER TABLE public."securityInsightsEvaluationSuiteControlEvaluations" REPLICA IDENTITY FULL;
ALTER TABLE public."securityInsightsEvaluationSuiteControlEvaluationAssessments" REPLICA IDENTITY FULL;