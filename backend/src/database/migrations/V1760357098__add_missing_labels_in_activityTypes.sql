UPDATE "activityTypes" SET label = 'Joined a server/guild' WHERE "activityType" = 'joined_guild' AND platform = 'discord';
UPDATE "activityTypes" SET label = 'Sent a message in a thread' WHERE "activityType" = 'thread_message' AND platform = 'discord';
UPDATE "activityTypes" SET label = 'Started a thread' WHERE "activityType" = 'thread_started' AND platform = 'discord';

UPDATE "activityTypes" SET label = 'Liked a post' WHERE "activityType" = 'like' AND platform = 'discourse';
UPDATE "activityTypes" SET label = 'Joined a forum' WHERE "activityType" = 'join' AND platform = 'discourse';
UPDATE "activityTypes" SET label = 'Created a topic' WHERE "activityType" = 'create_topic' AND platform = 'discourse';
UPDATE "activityTypes" SET label = 'Sent a message in topic' WHERE "activityType" = 'message_in_topic' AND platform = 'discourse';

UPDATE "activityTypes" SET label = 'Forked a repository' WHERE "activityType" = 'fork' AND platform = 'github';
UPDATE "activityTypes" SET label = 'Assigned to a pull request' WHERE "activityType" = 'pull_request-assigned' AND platform = 'github';
UPDATE "activityTypes" SET label = 'Reviewed a pull request' WHERE "activityType" = 'pull_request-reviewed' AND platform = 'github';
UPDATE "activityTypes" SET label = 'Starred a repository' WHERE "activityType" = 'star' AND platform = 'github';
UPDATE "activityTypes" SET label = 'Unstarred a repository' WHERE "activityType" = 'unstar' AND platform = 'github';

UPDATE "activityTypes" SET label = 'Forked a repository' WHERE "activityType" = 'fork' AND platform = 'gitlab';
UPDATE "activityTypes" SET label = 'Assigned to a merge request' WHERE "activityType" = 'merge_request-assigned' AND platform = 'gitlab';
UPDATE "activityTypes" SET label = 'Approved a merge request review' WHERE "activityType" = 'merge_request-review-approved' AND platform = 'gitlab';
UPDATE "activityTypes" SET label = 'Requested changes to a merge request' WHERE "activityType" = 'merge_request-review-changes-requested' AND platform = 'gitlab';
UPDATE "activityTypes" SET label = 'Requested a review on a merge request' WHERE "activityType" = 'merge_request-review-requested' AND platform = 'gitlab';
UPDATE "activityTypes" SET label = 'Starred a repository' WHERE "activityType" = 'star' AND platform = 'gitlab';

UPDATE "activityTypes" SET label = 'Joined a mailing list' WHERE "activityType" = 'member_join' AND platform = 'groupsio';
UPDATE "activityTypes" SET label = 'Left a mailing list' WHERE "activityType" = 'member_leave' AND platform = 'groupsio';

UPDATE "activityTypes" SET label = 'Closed an issue' WHERE "activityType" = 'issue-closed' AND platform = 'jira';

UPDATE "activityTypes" SET label = 'Reacted to a post' WHERE "activityType" = 'reaction' AND platform = 'linkedin';

UPDATE "activityTypes" SET label = 'Joined a channel' WHERE "activityType" = 'channel_joined' AND platform = 'slack';

UPDATE "activityTypes" SET label = 'Followed a user' WHERE "activityType" = 'follow' AND platform = 'twitter';
