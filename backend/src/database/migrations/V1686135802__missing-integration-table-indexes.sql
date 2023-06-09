create index if not exists "ix_integrationRuns_state" on "integrationRuns" (state);
create index if not exists "ix_integrationRuns_createdAt" on "integrationRuns" ("createdAt");
create index if not exists "ix_integrationStreams_state" on "integrationStreams" (state);
create index if not exists "ix_integration_runs_state" on integration.runs (state);
create index if not exists "ix_integration_streams_state" on integration.streams (state);
create index if not exists "ix_integration_apiData_state" on integration."apiData" (state);
create index if not exists "ix_integration_results_state" on integration.results (state);