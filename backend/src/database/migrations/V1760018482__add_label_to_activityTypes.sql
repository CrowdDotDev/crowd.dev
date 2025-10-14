ALTER TABLE "activityTypes" ADD COLUMN "label" VARCHAR(300) DEFAULT NULL;

-- SQL UPDATE statements for activityTypes table
-- Generated on: 2025-10-09T15:38:09.528Z

-- Platform: GitHub
UPDATE "activityTypes" SET "label" = 'Authored a commit' WHERE "platform" = 'github' AND "activityType" = 'authored-commit';
UPDATE "activityTypes" SET "label" = 'Closed a pull request' WHERE "platform" = 'github' AND "activityType" = 'pull_request-closed';
UPDATE "activityTypes" SET "label" = 'Opened a pull request' WHERE "platform" = 'github' AND "activityType" = 'pull_request-opened';
UPDATE "activityTypes" SET "label" = 'Commented on a pull request' WHERE "platform" = 'github' AND "activityType" = 'pull_request-comment';
UPDATE "activityTypes" SET "label" = 'Merged a pull request' WHERE "platform" = 'github' AND "activityType" = 'pull_request-merged';
UPDATE "activityTypes" SET "label" = 'Requested a review for a pull request' WHERE "platform" = 'github' AND "activityType" = 'pull_request-review-requested';
UPDATE "activityTypes" SET "label" = 'Commented on a pull request review thread' WHERE "platform" = 'github' AND "activityType" = 'pull_request-review-thread-comment';
UPDATE "activityTypes" SET "label" = 'Closed an issue' WHERE "platform" = 'github' AND "activityType" = 'issues-closed';
UPDATE "activityTypes" SET "label" = 'Opened an issue' WHERE "platform" = 'github' AND "activityType" = 'issues-opened';
UPDATE "activityTypes" SET "label" = 'Commented on an issue' WHERE "platform" = 'github' AND "activityType" = 'issue-comment';
UPDATE "activityTypes" SET "label" = 'Started a discussion' WHERE "platform" = 'github' AND "activityType" = 'discussion-started';
UPDATE "activityTypes" SET "label" = 'Commented on a discussion' WHERE "platform" = 'github' AND "activityType" = 'discussion-comment';

-- Platform: Git
UPDATE "activityTypes" SET "label" = 'Authored a commit' WHERE "platform" = 'git' AND "activityType" = 'authored-commit';
UPDATE "activityTypes" SET "label" = 'Reviewed a commit' WHERE "platform" = 'git' AND "activityType" = 'reviewed-commit';
UPDATE "activityTypes" SET "label" = 'Tested a commit' WHERE "platform" = 'git' AND "activityType" = 'tested-commit';
UPDATE "activityTypes" SET "label" = 'Co-authored a commit' WHERE "platform" = 'git' AND "activityType" = 'co-authored-commit';
UPDATE "activityTypes" SET "label" = 'Informed a commit' WHERE "platform" = 'git' AND "activityType" = 'informed-commit';
UPDATE "activityTypes" SET "label" = 'Influenced a commit' WHERE "platform" = 'git' AND "activityType" = 'influenced-commit';
UPDATE "activityTypes" SET "label" = 'Approved a commit' WHERE "platform" = 'git' AND "activityType" = 'approved-commit';
UPDATE "activityTypes" SET "label" = 'Committed a commit' WHERE "platform" = 'git' AND "activityType" = 'committed-commit';
UPDATE "activityTypes" SET "label" = 'Reported a commit' WHERE "platform" = 'git' AND "activityType" = 'reported-commit';
UPDATE "activityTypes" SET "label" = 'Resolved a commit' WHERE "platform" = 'git' AND "activityType" = 'resolved-commit';
UPDATE "activityTypes" SET "label" = 'Signed off a commit' WHERE "platform" = 'git' AND "activityType" = 'signed-off-commit';

-- Platform: Gerrit
UPDATE "activityTypes" SET "label" = 'Created a changeset' WHERE "platform" = 'gerrit' AND "activityType" = 'changeset-created';
UPDATE "activityTypes" SET "label" = 'Merged a changeset' WHERE "platform" = 'gerrit' AND "activityType" = 'changeset-merged';
UPDATE "activityTypes" SET "label" = 'Closed a changeset' WHERE "platform" = 'gerrit' AND "activityType" = 'changeset-closed';
UPDATE "activityTypes" SET "label" = 'Abandoned a changeset' WHERE "platform" = 'gerrit' AND "activityType" = 'changeset-abandoned';
UPDATE "activityTypes" SET "label" = 'Created a changeset comment' WHERE "platform" = 'gerrit' AND "activityType" = 'changeset_comment-created';
UPDATE "activityTypes" SET "label" = 'Created a patchset' WHERE "platform" = 'gerrit' AND "activityType" = 'patchset-created';
UPDATE "activityTypes" SET "label" = 'Created a patchset comment' WHERE "platform" = 'gerrit' AND "activityType" = 'patchset_comment-created';
UPDATE "activityTypes" SET "label" = 'Created a patchset approval' WHERE "platform" = 'gerrit' AND "activityType" = 'patchset_approval-created';

-- Platform: GitLab
UPDATE "activityTypes" SET "label" = 'Opened an issue' WHERE "platform" = 'gitlab' AND "activityType" = 'issues-opened';
UPDATE "activityTypes" SET "label" = 'Closed an issue' WHERE "platform" = 'gitlab' AND "activityType" = 'issues-closed';
UPDATE "activityTypes" SET "label" = 'Closed a merge request' WHERE "platform" = 'gitlab' AND "activityType" = 'merge_request-closed';
UPDATE "activityTypes" SET "label" = 'Opened a merge request' WHERE "platform" = 'gitlab' AND "activityType" = 'merge_request-opened';
UPDATE "activityTypes" SET "label" = 'Commented on a merge request review thread' WHERE "platform" = 'gitlab' AND "activityType" = 'merge_request-review-thread-comment';
UPDATE "activityTypes" SET "label" = 'Merged a merge request' WHERE "platform" = 'gitlab' AND "activityType" = 'merge_request-merged';
UPDATE "activityTypes" SET "label" = 'Commented on a merge request' WHERE "platform" = 'gitlab' AND "activityType" = 'merge_request-comment';
UPDATE "activityTypes" SET "label" = 'Commented on an issue' WHERE "platform" = 'gitlab' AND "activityType" = 'issue-comment';
UPDATE "activityTypes" SET "label" = 'Authored a commit' WHERE "platform" = 'gitlab' AND "activityType" = 'authored-commit';

-- Platform: Groups.io
UPDATE "activityTypes" SET "label" = 'Sent a message' WHERE "platform" = 'groupsio' AND "activityType" = 'message';

-- Platform: Confluence
UPDATE "activityTypes" SET "label" = 'Created a page' WHERE "platform" = 'confluence' AND "activityType" = 'page-created';
UPDATE "activityTypes" SET "label" = 'Updated a page' WHERE "platform" = 'confluence' AND "activityType" = 'page-updated';
UPDATE "activityTypes" SET "label" = 'Created a comment' WHERE "platform" = 'confluence' AND "activityType" = 'comment-created';
UPDATE "activityTypes" SET "label" = 'Created an attachment' WHERE "platform" = 'confluence' AND "activityType" = 'attachment-created';
UPDATE "activityTypes" SET "label" = 'Created a blog post' WHERE "platform" = 'confluence' AND "activityType" = 'blogpost-created';
UPDATE "activityTypes" SET "label" = 'Updated a blog post' WHERE "platform" = 'confluence' AND "activityType" = 'blogpost-updated';
UPDATE "activityTypes" SET "label" = 'Attached a file' WHERE "platform" = 'confluence' AND "activityType" = 'attachment';
UPDATE "activityTypes" SET "label" = 'Commented on a page' WHERE "platform" = 'confluence' AND "activityType" = 'comment';

-- Platform: Jira
UPDATE "activityTypes" SET "label" = 'Created an issue' WHERE "platform" = 'jira' AND "activityType" = 'issue-created';
UPDATE "activityTypes" SET "label" = 'Closed an issue' WHERE "platform" = 'jira' AND "activityType" = 'issues-closed';
UPDATE "activityTypes" SET "label" = 'Assigned an issue' WHERE "platform" = 'jira' AND "activityType" = 'issue-assigned';
UPDATE "activityTypes" SET "label" = 'Updated an issue' WHERE "platform" = 'jira' AND "activityType" = 'issue-updated';
UPDATE "activityTypes" SET "label" = 'Created an issue comment' WHERE "platform" = 'jira' AND "activityType" = 'issue-comment-created';
UPDATE "activityTypes" SET "label" = 'Updated an issue comment' WHERE "platform" = 'jira' AND "activityType" = 'issue-comment-updated';
UPDATE "activityTypes" SET "label" = 'Added an attachment to an issue' WHERE "platform" = 'jira' AND "activityType" = 'issue-attachment-added';

-- Platform: Dev.to
UPDATE "activityTypes" SET "label" = 'Commented on a post' WHERE "platform" = 'devto' AND "activityType" = 'comment';

-- Platform: Discord
UPDATE "activityTypes" SET "label" = 'Sent a message' WHERE "platform" = 'discord' AND "activityType" = 'message';
UPDATE "activityTypes" SET "label" = 'Started a thread' WHERE "platform" = 'discord' AND "activityType" = 'thread-started';
UPDATE "activityTypes" SET "label" = 'Sent a message in a thread' WHERE "platform" = 'discord' AND "activityType" = 'thread-message';

-- Platform: Discourse
UPDATE "activityTypes" SET "label" = 'Created a topic' WHERE "platform" = 'discourse' AND "activityType" = 'create-topic';
UPDATE "activityTypes" SET "label" = 'Sent a message in a topic' WHERE "platform" = 'discourse' AND "activityType" = 'message-in-topic';

-- Platform: Hacker News
UPDATE "activityTypes" SET "label" = 'Posted a post' WHERE "platform" = 'hackernews' AND "activityType" = 'post';
UPDATE "activityTypes" SET "label" = 'Commented on a post' WHERE "platform" = 'hackernews' AND "activityType" = 'comment';

-- Platform: LinkedIn
UPDATE "activityTypes" SET "label" = 'Commented on a post' WHERE "platform" = 'linkedin' AND "activityType" = 'comment';

-- Platform: Reddit
UPDATE "activityTypes" SET "label" = 'Posted a post' WHERE "platform" = 'reddit' AND "activityType" = 'post';
UPDATE "activityTypes" SET "label" = 'Commented on a post' WHERE "platform" = 'reddit' AND "activityType" = 'comment';

-- Platform: Slack
UPDATE "activityTypes" SET "label" = 'Sent a message' WHERE "platform" = 'slack' AND "activityType" = 'message';

-- Platform: Stack Overflow
UPDATE "activityTypes" SET "label" = 'Asked a question' WHERE "platform" = 'stackoverflow' AND "activityType" = 'question';
UPDATE "activityTypes" SET "label" = 'Answered a question' WHERE "platform" = 'stackoverflow' AND "activityType" = 'answer';

-- Platform: X/Twitter
UPDATE "activityTypes" SET "label" = 'Used a hashtag' WHERE "platform" = 'twitter' AND "activityType" = 'hashtag';
UPDATE "activityTypes" SET "label" = 'Mentioned a user' WHERE "platform" = 'twitter' AND "activityType" = 'mention';
