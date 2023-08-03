-- integration.runs
alter table integration.runs
    drop constraint if exists "runs_integrationId_fkey";

alter table integration.runs
    drop constraint if exists "runs_microserviceId_fkey";


-- integration.runs is queried by
-- state & integrationId
-- state & "createdAt"
-- state & "delayedUntil"
drop index if exists integration."ix_integration_runs_microserviceId";
drop index if exists integration."ix_integration_runs_processedAt";
drop index if exists integration."ix_integration_runs_tenantId";
create index if not exists "ix_integration_runs_delayedUntil" on integration.runs ("delayedUntil");

-- integration.streams
alter table integration.streams
    drop constraint if exists "streams_integrationId_fkey";

alter table integration.streams
    drop constraint if exists "streams_microserviceId_fkey";

alter table integration.streams
    drop constraint if exists "streams_parentId_fkey";

alter table integration.streams
    drop constraint if exists "streams_runId_fkey";

alter table integration.streams
    drop constraint if exists "streams_webhookId_fkey";

-- integration.streams is queried by
-- runId
-- runId & state & retries
-- state & delayedUntil
-- runId & state & createdAt
-- webhookId
drop index if exists integration."ix_integration_streams_integrationId";
drop index if exists integration."ix_integration_streams_microserviceId";
drop index if exists integration."ix_integration_streams_parentId";
drop index if exists integration."ix_integration_streams_processedAt";
drop index if exists integration."ix_integration_streams_tenantId";
create index if not exists "ix_integration_streams_webhookId" on integration.streams ("webhookId");
create index if not exists "ix_integration_streams_delayedUntil" on integration.streams ("delayedUntil");

-- integration.apiData
alter table integration."apiData"
    drop constraint if exists "apiData_integrationId_fkey";

alter table integration."apiData"
    drop constraint if exists "apiData_microserviceId_fkey";

alter table integration."apiData"
    drop constraint if exists "apiData_runId_fkey";

alter table integration."apiData"
    drop constraint if exists "apiData_streamId_fkey";

alter table integration."apiData"
    drop constraint if exists "apiData_webhookId_fkey";

-- integration.apiData is queried by
-- tenantId
drop index if exists integration."ix_integration_apiData_createdAt";
drop index if exists integration."ix_integration_apiData_integrationId";
drop index if exists integration."ix_integration_apiData_microserviceId";
drop index if exists integration."ix_integration_apiData_processedAt";
drop index if exists integration."ix_integration_apiData_runId";
drop index if exists integration."ix_integration_apiData_state";
drop index if exists integration."ix_integration_apiData_streamId";

-- integration.results
alter table integration.results
    drop constraint if exists "results_apiDataId_fkey";

alter table integration.results
    drop constraint if exists "results_integrationId_fkey";

alter table integration.results
    drop constraint if exists "results_microserviceId_fkey";

alter table integration.results
    drop constraint if exists "results_runId_fkey";

alter table integration.results
    drop constraint if exists "results_streamId_fkey";

alter table integration.results
    drop constraint if exists "results_webhookId_fkey";

-- integration.results is queried by
-- runId & state & createdAt

-- these three are all the same as ix_integration_results_updatedAt - all have index on integration.results.updatedAt
-- just the name is different because of a typo in the previous migration script
-- so integration.results.updatedAt had 4 indexes on it...
drop index if exists integration."ix_integration_apiData_updatedAt";
drop index if exists integration."ix_integration_runs_updatedAt";
drop index if exists integration."ix_integration_streams_updatedAt";

drop index if exists integration."ix_integration_results_apiDataId";
drop index if exists integration."ix_integration_results_integrationId";
drop index if exists integration."ix_integration_results_microserviceId";
drop index if exists integration."ix_integration_results_processedAt";
drop index if exists integration."ix_integration_results_streamId";
drop index if exists integration."ix_integration_results_tenantId";
drop index if exists integration."ix_integration_results_updatedAt";
drop index if exists integration."ix_integration_results_webhookId";
