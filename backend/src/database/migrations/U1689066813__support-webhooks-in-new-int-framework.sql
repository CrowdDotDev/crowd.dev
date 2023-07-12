alter table integration.streams
    drop constraint "streams_webhookId_fkey",
    drop column "webhookId",
    drop constraint "streams_runId_fkey",
    alter column "runId" set not null,
    add constraint "streams_runId_fkey" foreign key ("runId") references integration.runs (id) on delete cascade;

alter table integration."apiData"
    drop constraint "apiData_webhookId_fkey",
    drop column "webhookId",
    drop constraint "apiData_runId_fkey",
    alter column "runId" set not null,
    add constraint "apiData_runId_fkey" foreign key ("runId") references integration.runs (id) on delete cascade;

alter table integration.results
    drop constraint "results_webhookId_fkey",
    drop column "webhookId",
    drop constraint "results_runId_fkey",
    alter column "runId" set not null,
    add constraint "results_runId_fkey" foreign key ("runId") references integration.runs (id) on delete cascade;
