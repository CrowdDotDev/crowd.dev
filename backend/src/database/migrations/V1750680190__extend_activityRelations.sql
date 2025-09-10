-- extend activityRelations table with additional columns
alter table "activityRelations" 
add column "sourceId" varchar(150),
add column "type" varchar(50),
add column "timestamp" timestamp with time zone,
add column "sourceParentId" varchar(150),
add column "channel" varchar(150),
add column "sentimentScore" smallint,
add column "gitInsertions" integer,
add column "gitDeletions" integer,
add column "score" smallint,
add column "isContribution" boolean,
add column "pullRequestReviewState" varchar(20);
