-- Add description column to activityTypes table
ALTER TABLE "activityTypes" ADD COLUMN description TEXT;

-- Update descriptions for existing activity types

-- Confluence platform
UPDATE "activityTypes" SET description = 'Added file attachment to a Confluence page or blog post' WHERE "activityType" = 'attachment' AND platform = 'confluence';
UPDATE "activityTypes" SET description = 'Created file attachment in a Confluence page or blog post' WHERE "activityType" = 'attachment-created' AND platform = 'confluence';
UPDATE "activityTypes" SET description = 'Published a new Confluence blog post' WHERE "activityType" = 'blogpost-created' AND platform = 'confluence';
UPDATE "activityTypes" SET description = 'Updated an existing Confluence blog post' WHERE "activityType" = 'blogpost-updated' AND platform = 'confluence';
UPDATE "activityTypes" SET description = 'Posted a comment on a Confluence page or blog post' WHERE "activityType" = 'comment' AND platform = 'confluence';
UPDATE "activityTypes" SET description = 'Created comment in a Confluence page or blog post' WHERE "activityType" = 'comment-created' AND platform = 'confluence';
UPDATE "activityTypes" SET description = 'Created a new Confluence page' WHERE "activityType" = 'page-created' AND platform = 'confluence';
UPDATE "activityTypes" SET description = 'Edited or updated a Confluence page' WHERE "activityType" = 'page-updated' AND platform = 'confluence';

-- Dev.to platform
UPDATE "activityTypes" SET description = 'Commented on a Dev.to article' WHERE "activityType" = 'comment' AND platform = 'devto';

-- Discord platform
UPDATE "activityTypes" SET description = 'Joined Discord server/guild' WHERE "activityType" = 'joined_guild' AND platform = 'discord';
UPDATE "activityTypes" SET description = 'Sent a message in a Discord channel' WHERE "activityType" = 'message' AND platform = 'discord';
UPDATE "activityTypes" SET description = 'Sent a message in a Discord thread' WHERE "activityType" = 'thread_message' AND platform = 'discord';
UPDATE "activityTypes" SET description = 'Started thread in a Discord channel' WHERE "activityType" = 'thread_started' AND platform = 'discord';

-- Discourse platform
UPDATE "activityTypes" SET description = 'Liked post in a Discourse forum' WHERE "activityType" = 'like' AND platform = 'discourse';
UPDATE "activityTypes" SET description = 'Joined Discourse forum' WHERE "activityType" = 'join' AND platform = 'discourse';
UPDATE "activityTypes" SET description = 'Created topic in a Discourse forum' WHERE "activityType" = 'create_topic' AND platform = 'discourse';
UPDATE "activityTypes" SET description = 'Replied to topic in a Discourse forum' WHERE "activityType" = 'message_in_topic' AND platform = 'discourse';

-- Gerrit platform
UPDATE "activityTypes" SET description = 'Abandoned a code change in Gerrit' WHERE "activityType" = 'changeset-abandoned' AND platform = 'gerrit';
UPDATE "activityTypes" SET description = 'Closed a code review in Gerrit' WHERE "activityType" = 'changeset-closed' AND platform = 'gerrit';
UPDATE "activityTypes" SET description = 'Submitted a new changeset in Gerrit' WHERE "activityType" = 'changeset-created' AND platform = 'gerrit';
UPDATE "activityTypes" SET description = 'Merged a code change into the main branch in Gerrit' WHERE "activityType" = 'changeset-merged' AND platform = 'gerrit';
UPDATE "activityTypes" SET description = 'Started a new code review change' WHERE "activityType" = 'changeset-new' AND platform = 'gerrit';
UPDATE "activityTypes" SET description = 'Commented on a code changeset in Gerrit' WHERE "activityType" = 'changeset_comment-created' AND platform = 'gerrit';
UPDATE "activityTypes" SET description = 'Uploaded a new patchset for review in Gerrit' WHERE "activityType" = 'patchset-created' AND platform = 'gerrit';
UPDATE "activityTypes" SET description = 'Approved a code patchset for review in Gerrit' WHERE "activityType" = 'patchset_approval-created' AND platform = 'gerrit';
UPDATE "activityTypes" SET description = 'Commented on a code patchset in Gerrit' WHERE "activityType" = 'patchset_comment-created' AND platform = 'gerrit';

-- Git platform
UPDATE "activityTypes" SET description = 'Approved a Git commit during code review in the default branch' WHERE "activityType" = 'approved-commit' AND platform = 'git';
UPDATE "activityTypes" SET description = 'Authored a Git commit in the default branch' WHERE "activityType" = 'authored-commit' AND platform = 'git';
UPDATE "activityTypes" SET description = 'Co-authored a Git commit with another user in the default branch' WHERE "activityType" = 'co-authored-commit' AND platform = 'git';
UPDATE "activityTypes" SET description = 'Committed changes to a repository in the default branch' WHERE "activityType" = 'committed-commit' AND platform = 'git';
UPDATE "activityTypes" SET description = 'Indirectly influenced a Git commit's creation in the default branch' WHERE "activityType" = 'influenced-commit' AND platform = 'git';
UPDATE "activityTypes" SET description = 'Contributed ideas or guidance that led to a Git commit in the default branch' WHERE "activityType" = 'informed-commit' AND platform = 'git';
UPDATE "activityTypes" SET description = 'Reported an issue fixed by a Git commit in the default branch' WHERE "activityType" = 'reported-commit' AND platform = 'git';
UPDATE "activityTypes" SET description = 'Resolved an issue with a Git commit in the default branch' WHERE "activityType" = 'resolved-commit' AND platform = 'git';
UPDATE "activityTypes" SET description = 'Reviewed a Git commit in the default branch' WHERE "activityType" = 'reviewed-commit' AND platform = 'git';
UPDATE "activityTypes" SET description = 'Signed off on a Git commit for compliance/review in the default branch' WHERE "activityType" = 'signed-off-commit' AND platform = 'git';
UPDATE "activityTypes" SET description = 'Tested changes and marked them accordingly in the default branch' WHERE "activityType" = 'tested-commit' AND platform = 'git';

-- GitHub platform
UPDATE "activityTypes" SET description = 'Authored and pushed a commit in a pull request on GitHub' WHERE "activityType" = 'authored-commit' AND platform = 'github';
UPDATE "activityTypes" SET description = 'Commented on a GitHub discussion' WHERE "activityType" = 'discussion-comment' AND platform = 'github';
UPDATE "activityTypes" SET description = 'Started a GitHub discussion' WHERE "activityType" = 'discussion-started' AND platform = 'github';
UPDATE "activityTypes" SET description = 'Forked a GitHub repository' WHERE "activityType" = 'fork' AND platform = 'github';
UPDATE "activityTypes" SET description = 'Commented on a GitHub issue' WHERE "activityType" = 'issue-comment' AND platform = 'github';
UPDATE "activityTypes" SET description = 'Closed a GitHub issue' WHERE "activityType" = 'issues-closed' AND platform = 'github';
UPDATE "activityTypes" SET description = 'Opened a GitHub issue' WHERE "activityType" = 'issues-opened' AND platform = 'github';
UPDATE "activityTypes" SET description = 'Assigned to a GitHub pull request' WHERE "activityType" = 'pull_request-assigned' AND platform = 'github';
UPDATE "activityTypes" SET description = 'Closed a GitHub pull request' WHERE "activityType" = 'pull_request-closed' AND platform = 'github';
UPDATE "activityTypes" SET description = 'Commented on a GitHub pull request' WHERE "activityType" = 'pull_request-comment' AND platform = 'github';
UPDATE "activityTypes" SET description = 'Merged a GitHub pull request' WHERE "activityType" = 'pull_request-merged' AND platform = 'github';
UPDATE "activityTypes" SET description = 'Opened a GitHub pull request' WHERE "activityType" = 'pull_request-opened' AND platform = 'github';
UPDATE "activityTypes" SET description = 'Requested a review on a GitHub pull request' WHERE "activityType" = 'pull_request-review-requested' AND platform = 'github';
UPDATE "activityTypes" SET description = 'Reviewed a GitHub pull request' WHERE "activityType" = 'pull_request-reviewed' AND platform = 'github';
UPDATE "activityTypes" SET description = 'Starred a GitHub repository' WHERE "activityType" = 'star' AND platform = 'github';
UPDATE "activityTypes" SET description = 'Unstarred a GitHub repository' WHERE "activityType" = 'unstar' AND platform = 'github';

-- GitLab platform
UPDATE "activityTypes" SET description = 'Authored and pushed a commit in a merge request on GitLab' WHERE "activityType" = 'authored-commit' AND platform = 'gitlab';
UPDATE "activityTypes" SET description = 'Forked a GitLab repository' WHERE "activityType" = 'fork' AND platform = 'gitlab';
UPDATE "activityTypes" SET description = 'Commented on a GitLab issue' WHERE "activityType" = 'issue-comment' AND platform = 'gitlab';
UPDATE "activityTypes" SET description = 'Closed a GitLab issue' WHERE "activityType" = 'issues-closed' AND platform = 'gitlab';
UPDATE "activityTypes" SET description = 'Opened a GitLab issue' WHERE "activityType" = 'issues-opened' AND platform = 'gitlab';
UPDATE "activityTypes" SET description = 'Assigned to a GitLab merge request' WHERE "activityType" = 'merge_request-assigned' AND platform = 'gitlab';
UPDATE "activityTypes" SET description = 'Closed a GitLab merge request' WHERE "activityType" = 'merge_request-closed' AND platform = 'gitlab';
UPDATE "activityTypes" SET description = 'Commented on a GitLab merge request' WHERE "activityType" = 'merge_request-comment' AND platform = 'gitlab';
UPDATE "activityTypes" SET description = 'Merged a GitLab merge request' WHERE "activityType" = 'merge_request-merged' AND platform = 'gitlab';
UPDATE "activityTypes" SET description = 'Opened a GitLab merge request' WHERE "activityType" = 'merge_request-opened' AND platform = 'gitlab';
UPDATE "activityTypes" SET description = 'Approved a GitLab merge request review' WHERE "activityType" = 'merge_request-review-approved' AND platform = 'gitlab';
UPDATE "activityTypes" SET description = 'Requested changes on a GitLab merge request' WHERE "activityType" = 'merge_request-review-changes-requested' AND platform = 'gitlab';
UPDATE "activityTypes" SET description = 'Requested review on a GitLab merge request' WHERE "activityType" = 'merge_request-review-requested' AND platform = 'gitlab';
UPDATE "activityTypes" SET description = 'Starred a GitLab repository' WHERE "activityType" = 'star' AND platform = 'gitlab';

-- Groups.io platform
UPDATE "activityTypes" SET description = 'Sent message in a Groups.io mailing list' WHERE "activityType" = 'message' AND platform = 'groupsio';
UPDATE "activityTypes" SET description = 'Joined Groups.io mailing list' WHERE "activityType" = 'member_join' AND platform = 'groupsio';
UPDATE "activityTypes" SET description = 'Left Groups.io mailing list' WHERE "activityType" = 'member_leave' AND platform = 'groupsio';

-- Hackernews platform
UPDATE "activityTypes" SET description = 'Commented on a Hacker News story' WHERE "activityType" = 'comment' AND platform = 'hackernews';
UPDATE "activityTypes" SET description = 'Posted a story on Hacker News' WHERE "activityType" = 'post' AND platform = 'hackernews';

-- Jira platform
UPDATE "activityTypes" SET description = 'Added an assignee to a Jira issue' WHERE "activityType" = 'issue-assigned' AND platform = 'jira';
UPDATE "activityTypes" SET description = 'Added attachment to a Jira issue' WHERE "activityType" = 'issue-attachment-added' AND platform = 'jira';
UPDATE "activityTypes" SET description = 'Closed a Jira issue' WHERE "activityType" = 'issue-closed' AND platform = 'jira';
UPDATE "activityTypes" SET description = 'Created comment on a Jira issue' WHERE "activityType" = 'issue-comment-created' AND platform = 'jira';
UPDATE "activityTypes" SET description = 'Updated comment on a Jira issue' WHERE "activityType" = 'issue-comment-updated' AND platform = 'jira';
UPDATE "activityTypes" SET description = 'Created a Jira issue' WHERE "activityType" = 'issue-created' AND platform = 'jira';
UPDATE "activityTypes" SET description = 'Updated a Jira issue' WHERE "activityType" = 'issue-updated' AND platform = 'jira';

-- LinkedIn platform
UPDATE "activityTypes" SET description = 'Commented on a LinkedIn post' WHERE "activityType" = 'comment' AND platform = 'linkedin';
UPDATE "activityTypes" SET description = 'Reacted to a LinkedIn post' WHERE "activityType" = 'reaction' AND platform = 'linkedin';

-- Reddit platform
UPDATE "activityTypes" SET description = 'Commented on a Reddit post' WHERE "activityType" = 'comment' AND platform = 'reddit';
UPDATE "activityTypes" SET description = 'Posted on Reddit' WHERE "activityType" = 'post' AND platform = 'reddit';

-- Slack platform
UPDATE "activityTypes" SET description = 'Joined a Slack channel' WHERE "activityType" = 'channel_joined' AND platform = 'slack';
UPDATE "activityTypes" SET description = 'Sent a message in a Slack channel' WHERE "activityType" = 'message' AND platform = 'slack';

-- Stack Overflow platform
UPDATE "activityTypes" SET description = 'Answered a question on Stack Overflow' WHERE "activityType" = 'answer' AND platform = 'stackoverflow';
UPDATE "activityTypes" SET description = 'Asked a question on Stack Overflow' WHERE "activityType" = 'question' AND platform = 'stackoverflow';

-- Twitter platform
UPDATE "activityTypes" SET description = 'Used hashtag in a Twitter post' WHERE "activityType" = 'hashtag' AND platform = 'twitter';
UPDATE "activityTypes" SET description = 'Mentioned user in a Twitter post' WHERE "activityType" = 'mention' AND platform = 'twitter';
UPDATE "activityTypes" SET description = 'Followed user on Twitter' WHERE "activityType" = 'follow' AND platform = 'twitter';

-- Add NOT NULL constraint to description column
ALTER TABLE "activityTypes" ALTER COLUMN description SET NOT NULL;