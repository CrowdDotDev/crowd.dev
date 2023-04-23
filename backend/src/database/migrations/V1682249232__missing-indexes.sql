create index "ix_integrationRuns_tenantId" on "integrationRuns" ("tenantId");
create index "ix_integrationRuns_integrationId" on "integrationRuns" ("integrationId");
create index "ix_integrationRuns_microserviceId" on "integrationRuns" ("microserviceId");

create index "ix_integrationStreams_tenantId" on "integrationStreams" ("tenantId");
create index "ix_integrationStreams_integrationId" on "integrationStreams" ("integrationId");
create index "ix_integrationStreams_microserviceId" on "integrationStreams" ("microserviceId");

create index "ix_memberIdentities_tenantId" on "memberIdentities" ("tenantId");

create index "ix_conversations_tenantId" on conversations ("tenantId");

create index "ix_organizations_tenantId" on organizations ("tenantId");

create index "ix_automationExecutions_tenantId" on "automationExecutions" ("tenantId");

create index "ix_memberOrganizations_organizationId" on "memberOrganizations" ("organizationId");

create index "ix_widgets_tenantId" on widgets ("tenantId");
create index "ix_widgets_reportId" on widgets ("reportId");

create index "ix_memberAttributeSettings_tenantId" on "memberAttributeSettings" ("tenantId");

create index "ix_integrations_tenantId" on integrations ("tenantId");

create index "ix_tasks_tenantId" on tasks ("tenantId");

create index "ix_settings_tenantId" on settings ("tenantId");

create index "ix_tenantUsers_userId" on "tenantUsers" ("userId");
create index "ix_tenantUsers_tenantId" on "tenantUsers" ("tenantId");

create index "ix_reports_tenantId" on reports ("tenantId");

create index "ix_microservices_tenantId" on microservices ("tenantId");

create index "ix_memberTags_tagId" on "memberTags" ("tagId");

create index "ix_eagleEyeContents_tenantId" on "eagleEyeContents" ("tenantId");

create index "ix_eagleEyeActions_tenantId" on "eagleEyeActions" ("tenantId");
create index "ix_eagleEyeActions_actionById" on "eagleEyeActions" ("actionById");
create index "ix_eagleEyeActions_contentId" on "eagleEyeActions" ("contentId");

create index "ix_tags_tenantId" on tags ("tenantId");

create index "ix_notes_tenantId" on notes ("tenantId");

create index "ix_memberNotes_noteId" on "memberNotes" ("noteId");

create index "ix_memberTasks_taskId" on "memberTasks" ("taskId");

create index "ix_taskAssignees_userId" on "taskAssignees" ("userId");

create index "ix_files_tenantId" on files ("tenantId");

create index "ix_activityTasks_taskId" on "activityTasks" ("taskId");

create index "ix_repos_tenantId" on repos ("tenantId");