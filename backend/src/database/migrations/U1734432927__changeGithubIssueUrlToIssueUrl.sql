alter table "dataIssues"
rename column "issueUrl" to "githubIssueUrl";

alter table "dataIssues" 
add column "resolutionEmailSentAt" timestamp;

alter table "dataIssues" 
add column "resolutionEmailSentTo" text;