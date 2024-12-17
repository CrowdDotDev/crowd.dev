alter table "dataIssues" 
rename column "githubIssueUrl" to "issueUrl";

alter table "dataIssues" 
drop column "resolutionEmailSentAt";

alter table "dataIssues" 
drop column "resolutionEmailSentTo";