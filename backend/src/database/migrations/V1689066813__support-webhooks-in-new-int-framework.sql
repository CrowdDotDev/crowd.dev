alter table integration.streams
    drop constraint "streams_runId_fkey";

alter table integration.streams
    alter column "runId" drop not null,
    add column "webhookId" uuid null,
    add constraint "streams_runId_fkey" foreign key ("runId") references integration.runs (id),
    add constraint "streams_webhookId_fkey" foreign key ("webhookId") references "incomingWebhooks" (id);


alter table integration."apiData"
    drop constraint "apiData_runId_fkey";

alter table integration."apiData"
    alter column "runId" drop not null,
    add column "webhookId" uuid null,
    add constraint "apiData_runId_fkey" foreign key ("runId") references integration.runs (id),
    add constraint "apiData_webhookId_fkey" foreign key ("webhookId") references "incomingWebhooks" (id);

alter table integration.results
    drop constraint "results_runId_fkey";

alter table integration.results
    alter column "runId" drop not null,
    add column "webhookId" uuid null,
    add constraint "results_runId_fkey" foreign key ("runId") references integration.runs (id),
    add constraint "results_webhookId_fkey" foreign key ("webhookId") references "incomingWebhooks" (id);