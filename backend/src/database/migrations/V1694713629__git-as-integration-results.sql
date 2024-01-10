alter table integration.results
    alter column "apiDataId" drop not null;

alter table integration.results
    alter column "streamId" drop not null;