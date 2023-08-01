-- remove foreign keys on integration.runs
alter table integration.runs
    drop constraint if exists "runs_integrationId_fkey";

alter table integration.runs
    drop constraint if exists "runs_microserviceId_fkey";

-- remove foreign keys on integration.streams
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

-- remove foreign keys on integration.apiData
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

-- remove foreign keys on integration.results
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