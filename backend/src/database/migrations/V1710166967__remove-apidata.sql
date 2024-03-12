alter table integration.results
    drop column if exists "apiDataId";

drop table if exists integration."apiData";