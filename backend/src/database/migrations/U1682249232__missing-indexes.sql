drop index "ix_integrationRuns_tenantId";
drop index "ix_integrationRuns_integrationId";
drop index "ix_integrationRuns_microserviceId";

drop index "ix_integrationStreams_tenantId";
drop index "ix_integrationStreams_integrationId";
drop index "ix_integrationStreams_microserviceId";

drop index "ix_memberIdentities_tenantId";

drop index "ix_conversations_tenantId";

drop index "ix_organizations_tenantId";

drop index "ix_automationExecutions_tenantId";

drop index "ix_memberOrganizations_organizationId";

drop index "ix_widgets_tenantId";
drop index "ix_widgets_reportId";

drop index "ix_memberAttributeSettings_tenantId";

drop index "ix_integrations_tenantId";

drop index "ix_tasks_tenantId";

drop index "ix_settings_tenantId";

drop index "ix_tenantUsers_userId";
drop index "ix_tenantUsers_tenantId";

drop index "ix_reports_tenantId";

drop index "ix_microservices_tenantId";

drop index "ix_memberTags_tagId";

drop index "ix_eagleEyeContents_tenantId";

drop index "ix_eagleEyeActions_tenantId";
drop index "ix_eagleEyeActions_actionById";
drop index "ix_eagleEyeActions_contentId";

drop index "ix_tags_tenantId";

drop index "ix_notes_tenantId";

drop index "ix_memberNotes_noteId";

drop index "ix_memberTasks_taskId";

drop index "ix_taskAssignees_userId";

drop index "ix_files_tenantId";

drop index "ix_activityTasks_taskId";