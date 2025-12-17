UPDATE "activityTypes" SET label = NULL WHERE "activityType" = 'joined_guild' AND platform = 'discord';
UPDATE "activityTypes" SET label = NULL WHERE "activityType" = 'thread_message' AND platform = 'discord';
UPDATE "activityTypes" SET label = NULL WHERE "activityType" = 'thread_started' AND platform = 'discord';

UPDATE "activityTypes" SET label = NULL WHERE "activityType" = 'like' AND platform = 'discourse';
UPDATE "activityTypes" SET label = NULL WHERE "activityType" = 'join' AND platform = 'discourse';
UPDATE "activityTypes" SET label = NULL WHERE "activityType" = 'create_topic' AND platform = 'discourse';
UPDATE "activityTypes" SET label = NULL WHERE "activityType" = 'message_in_topic' AND platform = 'discourse';

UPDATE "activityTypes" SET label = NULL WHERE "activityType" = 'fork' AND platform = 'github';
UPDATE "activityTypes" SET label = NULL WHERE "activityType" = 'pull_request-assigned' AND platform = 'github';
UPDATE "activityTypes" SET label = NULL WHERE "activityType" = 'pull_request-reviewed' AND platform = 'github';
UPDATE "activityTypes" SET label = NULL WHERE "activityType" = 'star' AND platform = 'github';
UPDATE "activityTypes" SET label = NULL WHERE "activityType" = 'unstar' AND platform = 'github';

UPDATE "activityTypes" SET label = NULL WHERE "activityType" = 'fork' AND platform = 'gitlab';
UPDATE "activityTypes" SET label = NULL WHERE "activityType" = 'merge_request-assigned' AND platform = 'gitlab';
UPDATE "activityTypes" SET label = NULL WHERE "activityType" = 'merge_request-review-approved' AND platform = 'gitlab';
UPDATE "activityTypes" SET label = NULL WHERE "activityType" = 'merge_request-review-changes-requested' AND platform = 'gitlab';
UPDATE "activityTypes" SET label = NULL WHERE "activityType" = 'merge_request-review-requested' AND platform = 'gitlab';
UPDATE "activityTypes" SET label = NULL WHERE "activityType" = 'star' AND platform = 'gitlab';

UPDATE "activityTypes" SET label = NULL WHERE "activityType" = 'member_join' AND platform = 'groupsio';
UPDATE "activityTypes" SET label = NULL WHERE "activityType" = 'member_leave' AND platform = 'groupsio';

UPDATE "activityTypes" SET label = NULL WHERE "activityType" = 'issue-closed' AND platform = 'jira';

UPDATE "activityTypes" SET label = NULL WHERE "activityType" = 'reaction' AND platform = 'linkedin';

UPDATE "activityTypes" SET label = NULL WHERE "activityType" = 'channel_joined' AND platform = 'slack';

UPDATE "activityTypes" SET label = NULL WHERE "activityType" = 'follow' AND platform = 'twitter';
