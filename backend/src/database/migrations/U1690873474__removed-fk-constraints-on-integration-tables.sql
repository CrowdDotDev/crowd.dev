-- integration.results
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
