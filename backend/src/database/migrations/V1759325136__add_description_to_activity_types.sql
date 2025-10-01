-- Add description column to activityTypes table
ALTER TABLE "activityTypes" ADD COLUMN description TEXT;

-- Update descriptions for existing activity types

-- Confluence platform
UPDATE "activityTypes" SET description = 'Added file attachment to Confluence page or blog' WHERE "activityType" = 'attachment' AND platform = 'confluence';
UPDATE "activityTypes" SET description = 'Created file attachment in Confluence' WHERE "activityType" = 'attachment-created' AND platform = 'confluence';
UPDATE "activityTypes" SET description = 'Created blog post in Confluence' WHERE "activityType" = 'blogpost-created' AND platform = 'confluence';
UPDATE "activityTypes" SET description = 'Updated blog post in Confluence' WHERE "activityType" = 'blogpost-updated' AND platform = 'confluence';
UPDATE "activityTypes" SET description = 'Added comment in Confluence' WHERE "activityType" = 'comment' AND platform = 'confluence';
UPDATE "activityTypes" SET description = 'Created comment in Confluence' WHERE "activityType" = 'comment-created' AND platform = 'confluence';
UPDATE "activityTypes" SET description = 'Created page in Confluence' WHERE "activityType" = 'page-created' AND platform = 'confluence';
UPDATE "activityTypes" SET description = 'Updated page in Confluence' WHERE "activityType" = 'page-updated' AND platform = 'confluence';

-- Dev.to platform
UPDATE "activityTypes" SET description = 'Commented on Dev.to article' WHERE "activityType" = 'comment' AND platform = 'devto';

-- Discord platform
UPDATE "activityTypes" SET description = 'Joined Discord server/guild' WHERE "activityType" = 'joined_guild' AND platform = 'discord';
UPDATE "activityTypes" SET description = 'Sent message in Discord channel' WHERE "activityType" = 'message' AND platform = 'discord';
UPDATE "activityTypes" SET description = 'Sent message in Discord thread' WHERE "activityType" = 'thread_message' AND platform = 'discord';
UPDATE "activityTypes" SET description = 'Started thread in Discord channel' WHERE "activityType" = 'thread_started' AND platform = 'discord';

-- Discourse platform
UPDATE "activityTypes" SET description = 'Liked post in Discourse forum' WHERE "activityType" = 'like' AND platform = 'discourse';
UPDATE "activityTypes" SET description = 'Joined Discourse forum' WHERE "activityType" = 'join' AND platform = 'discourse';
UPDATE "activityTypes" SET description = 'Created topic in Discourse forum' WHERE "activityType" = 'create_topic' AND platform = 'discourse';
UPDATE "activityTypes" SET description = 'Replied to topic in Discourse forum' WHERE "activityType" = 'message_in_topic' AND platform = 'discourse';

-- Gerrit platform
UPDATE "activityTypes" SET description = 'Abandoned code changeset in Gerrit' WHERE "activityType" = 'changeset-abandoned' AND platform = 'gerrit';
UPDATE "activityTypes" SET description = 'Closed code changeset in Gerrit' WHERE "activityType" = 'changeset-closed' AND platform = 'gerrit';
UPDATE "activityTypes" SET description = 'Created code changeset in Gerrit' WHERE "activityType" = 'changeset-created' AND platform = 'gerrit';
UPDATE "activityTypes" SET description = 'Merged code changeset in Gerrit' WHERE "activityType" = 'changeset-merged' AND platform = 'gerrit';
UPDATE "activityTypes" SET description = 'Submitted new code changeset in Gerrit' WHERE "activityType" = 'changeset-new' AND platform = 'gerrit';
UPDATE "activityTypes" SET description = 'Commented on code changeset in Gerrit' WHERE "activityType" = 'changeset_comment-created' AND platform = 'gerrit';
UPDATE "activityTypes" SET description = 'Created code patchset in Gerrit' WHERE "activityType" = 'patchset-created' AND platform = 'gerrit';
UPDATE "activityTypes" SET description = 'Approved code patchset in Gerrit' WHERE "activityType" = 'patchset_approval-created' AND platform = 'gerrit';
UPDATE "activityTypes" SET description = 'Commented on code patchset in Gerrit' WHERE "activityType" = 'patchset_comment-created' AND platform = 'gerrit';

-- Git platform
UPDATE "activityTypes" SET description = 'Approved git commit in default branch' WHERE "activityType" = 'approved-commit' AND platform = 'git';
UPDATE "activityTypes" SET description = 'Authored git commit in default branch' WHERE "activityType" = 'authored-commit' AND platform = 'git';
UPDATE "activityTypes" SET description = 'Co-authored git commit in default branch' WHERE "activityType" = 'co-authored-commit' AND platform = 'git';
UPDATE "activityTypes" SET description = 'Committed git changes in default branch' WHERE "activityType" = 'committed-commit' AND platform = 'git';
UPDATE "activityTypes" SET description = 'Influenced git commit in default branch' WHERE "activityType" = 'influenced-commit' AND platform = 'git';
UPDATE "activityTypes" SET description = 'Informed about git commit in default branch' WHERE "activityType" = 'informed-commit' AND platform = 'git';
UPDATE "activityTypes" SET description = 'Reported git commit in default branch' WHERE "activityType" = 'reported-commit' AND platform = 'git';
UPDATE "activityTypes" SET description = 'Resolved git commit in default branch' WHERE "activityType" = 'resolved-commit' AND platform = 'git';
UPDATE "activityTypes" SET description = 'Reviewed git commit in default branch' WHERE "activityType" = 'reviewed-commit' AND platform = 'git';
UPDATE "activityTypes" SET description = 'Signed off git commit in default branch' WHERE "activityType" = 'signed-off-commit' AND platform = 'git';
UPDATE "activityTypes" SET description = 'Tested git commit in default branch' WHERE "activityType" = 'tested-commit' AND platform = 'git';

-- GitHub platform
UPDATE "activityTypes" SET description = 'Authored and pushed a commit in a pull requeston GitHub' WHERE "activityType" = 'authored-commit' AND platform = 'github';
UPDATE "activityTypes" SET description = 'Commented on GitHub discussion' WHERE "activityType" = 'discussion-comment' AND platform = 'github';
UPDATE "activityTypes" SET description = 'Started GitHub discussion' WHERE "activityType" = 'discussion-started' AND platform = 'github';
UPDATE "activityTypes" SET description = 'Forked GitHub repository' WHERE "activityType" = 'fork' AND platform = 'github';
UPDATE "activityTypes" SET description = 'Commented on GitHub issue' WHERE "activityType" = 'issue-comment' AND platform = 'github';
UPDATE "activityTypes" SET description = 'Closed GitHub issue' WHERE "activityType" = 'issues-closed' AND platform = 'github';
UPDATE "activityTypes" SET description = 'Opened GitHub issue' WHERE "activityType" = 'issues-opened' AND platform = 'github';
UPDATE "activityTypes" SET description = 'Assigned to GitHub pull request' WHERE "activityType" = 'pull_request-assigned' AND platform = 'github';
UPDATE "activityTypes" SET description = 'Closed GitHub pull request' WHERE "activityType" = 'pull_request-closed' AND platform = 'github';
UPDATE "activityTypes" SET description = 'Commented on GitHub pull request' WHERE "activityType" = 'pull_request-comment' AND platform = 'github';
UPDATE "activityTypes" SET description = 'Merged GitHub pull request' WHERE "activityType" = 'pull_request-merged' AND platform = 'github';
UPDATE "activityTypes" SET description = 'Opened GitHub pull request' WHERE "activityType" = 'pull_request-opened' AND platform = 'github';
UPDATE "activityTypes" SET description = 'Requested review on GitHub pull request' WHERE "activityType" = 'pull_request-review-requested' AND platform = 'github';
UPDATE "activityTypes" SET description = 'Reviewed GitHub pull request' WHERE "activityType" = 'pull_request-reviewed' AND platform = 'github';
UPDATE "activityTypes" SET description = 'Starred GitHub repository' WHERE "activityType" = 'star' AND platform = 'github';
UPDATE "activityTypes" SET description = 'Unstarred GitHub repository' WHERE "activityType" = 'unstar' AND platform = 'github';

-- GitLab platform
UPDATE "activityTypes" SET description = 'Authored and pushed a commit in a merge request on GitLab' WHERE "activityType" = 'authored-commit' AND platform = 'gitlab';
UPDATE "activityTypes" SET description = 'Forked GitLab repository' WHERE "activityType" = 'fork' AND platform = 'gitlab';
UPDATE "activityTypes" SET description = 'Commented on GitLab issue' WHERE "activityType" = 'issue-comment' AND platform = 'gitlab';
UPDATE "activityTypes" SET description = 'Closed GitLab issue' WHERE "activityType" = 'issues-closed' AND platform = 'gitlab';
UPDATE "activityTypes" SET description = 'Opened GitLab issue' WHERE "activityType" = 'issues-opened' AND platform = 'gitlab';
UPDATE "activityTypes" SET description = 'Assigned to GitLab merge request' WHERE "activityType" = 'merge_request-assigned' AND platform = 'gitlab';
UPDATE "activityTypes" SET description = 'Closed GitLab merge request' WHERE "activityType" = 'merge_request-closed' AND platform = 'gitlab';
UPDATE "activityTypes" SET description = 'Commented on GitLab merge request' WHERE "activityType" = 'merge_request-comment' AND platform = 'gitlab';
UPDATE "activityTypes" SET description = 'Merged GitLab merge request' WHERE "activityType" = 'merge_request-merged' AND platform = 'gitlab';
UPDATE "activityTypes" SET description = 'Opened GitLab merge request' WHERE "activityType" = 'merge_request-opened' AND platform = 'gitlab';
UPDATE "activityTypes" SET description = 'Approved GitLab merge request review' WHERE "activityType" = 'merge_request-review-approved' AND platform = 'gitlab';
UPDATE "activityTypes" SET description = 'Requested changes on GitLab merge request' WHERE "activityType" = 'merge_request-review-changes-requested' AND platform = 'gitlab';
UPDATE "activityTypes" SET description = 'Requested review on GitLab merge request' WHERE "activityType" = 'merge_request-review-requested' AND platform = 'gitlab';
UPDATE "activityTypes" SET description = 'Starred GitLab repository' WHERE "activityType" = 'star' AND platform = 'gitlab';

-- Groups.io platform
UPDATE "activityTypes" SET description = 'Sent message in Groups.io mailing list' WHERE "activityType" = 'message' AND platform = 'groupsio';
UPDATE "activityTypes" SET description = 'Joined Groups.io mailing list' WHERE "activityType" = 'member_join' AND platform = 'groupsio';
UPDATE "activityTypes" SET description = 'Left Groups.io mailing list' WHERE "activityType" = 'member_leave' AND platform = 'groupsio';

-- Hackernews platform
UPDATE "activityTypes" SET description = 'Commented on Hacker News story' WHERE "activityType" = 'comment' AND platform = 'hackernews';
UPDATE "activityTypes" SET description = 'Posted story on Hacker News' WHERE "activityType" = 'post' AND platform = 'hackernews';

-- Jira platform
UPDATE "activityTypes" SET description = 'Added an assignee to Jira issue' WHERE "activityType" = 'issue-assigned' AND platform = 'jira';
UPDATE "activityTypes" SET description = 'Added attachment to Jira issue' WHERE "activityType" = 'issue-attachment-added' AND platform = 'jira';
UPDATE "activityTypes" SET description = 'Closed Jira issue' WHERE "activityType" = 'issue-closed' AND platform = 'jira';
UPDATE "activityTypes" SET description = 'Created comment on Jira issue' WHERE "activityType" = 'issue-comment-created' AND platform = 'jira';
UPDATE "activityTypes" SET description = 'Updated comment on Jira issue' WHERE "activityType" = 'issue-comment-updated' AND platform = 'jira';
UPDATE "activityTypes" SET description = 'Created Jira issue' WHERE "activityType" = 'issue-created' AND platform = 'jira';
UPDATE "activityTypes" SET description = 'Updated Jira issue' WHERE "activityType" = 'issue-updated' AND platform = 'jira';

-- LinkedIn platform
UPDATE "activityTypes" SET description = 'Commented on LinkedIn post' WHERE "activityType" = 'comment' AND platform = 'linkedin';
UPDATE "activityTypes" SET description = 'Reacted to LinkedIn post' WHERE "activityType" = 'reaction' AND platform = 'linkedin';

-- Reddit platform
UPDATE "activityTypes" SET description = 'Commented on Reddit post' WHERE "activityType" = 'comment' AND platform = 'reddit';
UPDATE "activityTypes" SET description = 'Posted on Reddit' WHERE "activityType" = 'post' AND platform = 'reddit';

-- Slack platform
UPDATE "activityTypes" SET description = 'Joined Slack channel' WHERE "activityType" = 'channel_joined' AND platform = 'slack';
UPDATE "activityTypes" SET description = 'Sent message in Slack channel' WHERE "activityType" = 'message' AND platform = 'slack';

-- Stack Overflow platform
UPDATE "activityTypes" SET description = 'Answered question on Stack Overflow' WHERE "activityType" = 'answer' AND platform = 'stackoverflow';
UPDATE "activityTypes" SET description = 'Asked question on Stack Overflow' WHERE "activityType" = 'question' AND platform = 'stackoverflow';

-- Twitter platform
UPDATE "activityTypes" SET description = 'Used hashtag in Twitter post' WHERE "activityType" = 'hashtag' AND platform = 'twitter';
UPDATE "activityTypes" SET description = 'Mentioned user in Twitter post' WHERE "activityType" = 'mention' AND platform = 'twitter';
UPDATE "activityTypes" SET description = 'Followed user on Twitter' WHERE "activityType" = 'follow' AND platform = 'twitter';

-- Add NOT NULL constraint to description column
ALTER TABLE "activityTypes" ALTER COLUMN description SET NOT NULL;