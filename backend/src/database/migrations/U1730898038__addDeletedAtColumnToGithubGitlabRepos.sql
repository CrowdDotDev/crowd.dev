alter table "githubRepos"
drop column if exists "deletedAt";

alter table "gitlabRepos"
drop column if exists "deletedAt";