-- integration.results

create index if not exists "ix_integration_results_webhookId" on integration.results ("webhookId");
create index if not exists "ix_integration_results_updatedAt" on integration.results ("updatedAt");
create index if not exists "ix_integration_results_tenantId" on integration.results ("tenantId");
create index if not exists "ix_integration_results_streamId" on integration.results ("streamId");
create index if not exists "ix_integration_results_processedAt" on integration.results ("processedAt");
create index if not exists "ix_integration_results_microserviceId" on integration.results ("microserviceId");
create index if not exists "ix_integration_results_integrationId" on integration.results ("integrationId");
create index if not exists "ix_integration_results_apiDataId" on integration.results ("apiDataId");

alter table integration.results
    add constraint "results_webhookId_fkey" foreign key ("webhookId") references "incomingWebhooks" (id);

alter table integration.results
    add constraint "results_streamId_fkey" foreign key ("streamId") references integration.streams (id);

alter table integration.results
    add constraint "results_runId_fkey" foreign key ("runId") references integration.runs (id);

alter table integration.results
    add constraint "results_microserviceId_fkey" foreign key ("microserviceId") references microservices (id);

alter table integration.results
    add constraint "results_integrationId_fkey" foreign key ("integrationId") references integrations (id);

alter table integration.results
    add constraint "results_apiDataId_fkey" foreign key ("apiDataId") references integration."apiData" (id);

-- integration.apiData
create index if not exists "ix_integration_apiData_createdAt" on integration."apiData"("createdAt");
create index if not exists "ix_integration_apiData_integrationId" on integration."apiData"("integrationId");
create index if not exists "ix_integration_apiData_microserviceId" on integration."apiData"("microserviceId");
create index if not exists "ix_integration_apiData_processedAt" on integration."apiData"("processedAt");
create index if not exists "ix_integration_apiData_runId" on integration."apiData"("runId");
create index if not exists "ix_integration_apiData_state" on integration."apiData"("state");
create index if not exists "ix_integration_apiData_streamId" on integration."apiData"("streamId");

alter table integration."apiData"
    add constraint "apiData_webhookId_fkey" foreign key ("webhookId") references "incomingWebhooks" (id);

alter table integration."apiData"
    add constraint "apiData_streamId_fkey" foreign key ("streamId") references integration.streams (id);

alter table integration."apiData"
    add constraint "apiData_runId_fkey" foreign key ("runId") references integration.runs (id);

alter table integration."apiData"
    add constraint "apiData_microserviceId_fkey" foreign key ("microserviceId") references microservices (id);

alter table integration."apiData"
    add constraint "apiData_integrationId_fkey" foreign key ("integrationId") references integrations (id);

-- integration.streams
drop index if exists "ix_integration_streams_delayedUntil";
drop index if exists "ix_integration_streams_webhookId";
create index if not exists "ix_integration_streams_tenantId" on integration.streams ("tenantId");
create index if not exists "ix_integration_streams_processedAt" on integration.streams ("processedAt");
create index if not exists "ix_integration_streams_parentId" on integration.streams ("parentId");
create index if not exists "ix_integration_streams_microserviceId" on integration.streams ("microserviceId");
create index if not exists "ix_integration_streams_integrationId" on integration.streams ("integrationId");

alter table integration.streams
    add constraint "streams_webhookId_fkey" foreign key ("webhookId") references "incomingWebhooks" (id);

alter table integration.streams
    add constraint "streams_runId_fkey" foreign key ("runId") references integration.runs (id);

alter table integration.streams
    add constraint "streams_parentId_fkey" foreign key ("parentId") references integration.streams (id);

alter table integration.streams
    add constraint "streams_microserviceId_fkey" foreign key ("microserviceId") references microservices (id);

alter table integration.streams
    add constraint "streams_integrationId_fkey" foreign key ("integrationId") references integrations (id);

-- integration.runs
drop index if exists "ix_integration_runs_delayedUntil";
create index if not exists "ix_integration_runs_tenantId" on integration.runs("tenantId");
create index if not exists "ix_integration_runs_processedAt" on integration.runs("processedAt");
create index if not exists "ix_integration_runs_microserviceId" on integration.runs("microserviceId");

alter table integration.runs
    add constraint "runs_microserviceId_fkey" foreign key ("microserviceId") references microservices (id);

alter table integration.streams
    add constraint "runs_integrationId_fkey" foreign key ("integrationId") references integrations (id);