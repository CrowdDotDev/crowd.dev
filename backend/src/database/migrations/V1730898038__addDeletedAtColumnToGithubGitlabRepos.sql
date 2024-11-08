alter table "githubRepos" 
add column "deletedAt" timestamp without time zone;

alter table "gitlabRepos" 
add column "deletedAt" timestamp without time zone;