drop table if exists "maintainersInternal";

alter table "githubRepos" 
drop column if exists "maintainerFile",
drop column if exists "lastMaintainerRunAt";