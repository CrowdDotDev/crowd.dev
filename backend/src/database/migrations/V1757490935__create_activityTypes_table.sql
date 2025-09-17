CREATE TABLE "activityTypes" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "activityType" VARCHAR(150),
    platform VARCHAR(150),
    "isCodeContribution" BOOLEAN,
    "isCollaboration" BOOLEAN,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "idx_activityTypes_activityType"
    ON "activityTypes" ("activityType");


-- Insert Code Contributions activity types
-- Git platform (Code Contributions)
INSERT INTO "activityTypes" ("activityType", platform, "isCodeContribution", "isCollaboration") VALUES
('authored-commit', 'git', true, false),
('reviewed-commit', 'git', true, false),
('tested-commit', 'git', true, false),
('co-authored-commit', 'git', true, false),
('informed-commit', 'git', true, false),
('influenced-commit', 'git', true, false),
('approved-commit', 'git', true, false),
('committed-commit', 'git', true, false),
('reported-commit', 'git', true, false),
('resolved-commit', 'git', true, false),
('signed-off-commit', 'git', true, false);

-- GitHub platform (Code Contributions)
INSERT INTO "activityTypes" ("activityType", platform, "isCodeContribution", "isCollaboration") VALUES
('pull_request-opened', 'github', true, false),
('pull_request-closed', 'github', true, false),
('pull_request-review-requested', 'github', true, false),
('pull_request-reviewed', 'github', true, false),
('pull_request-merged', 'github', true, false),
('pull_request-comment', 'github', true, false),
('authored-commit', 'github', true, false);

-- Gerrit platform (Code Contributions)
INSERT INTO "activityTypes" ("activityType", platform, "isCodeContribution", "isCollaboration") VALUES
('changeset-new', 'gerrit', true, false),
('changeset-created', 'gerrit', true, false),
('changeset-merged', 'gerrit', true, false),
('changeset-closed', 'gerrit', true, false),
('changeset-abandoned', 'gerrit', true, false),
('changeset_comment-created', 'gerrit', true, false),
('patchset-created', 'gerrit', true, false),
('patchset_comment-created', 'gerrit', true, false),
('patchset_approval-created', 'gerrit', true, false);

-- GitLab platform (Code Contributions)
INSERT INTO "activityTypes" ("activityType", platform, "isCodeContribution", "isCollaboration") VALUES
('merge_request-opened', 'gitlab', true, false),
('merge_request-closed', 'gitlab', true, false),
('merge_request-review-requested', 'gitlab', true, false),
('merge_request-review-approved', 'gitlab', true, false),
('merge_request-review-changes-requested', 'gitlab', true, false),
('merge_request-merged', 'gitlab', true, false),
('merge_request-comment', 'gitlab', true, false);

-- Insert Collaboration activity types
-- GitHub platform (Collaboration)
INSERT INTO "activityTypes" ("activityType", platform, "isCodeContribution", "isCollaboration") VALUES
('discussion-started', 'github', false, true),
('issues-opened', 'github', false, true),
('issues-closed', 'github', false, true),
('issue-comment', 'github', false, true),
('discussion-comment', 'github', false, true);

-- GitLab platform (Collaboration)
INSERT INTO "activityTypes" ("activityType", platform, "isCodeContribution", "isCollaboration") VALUES
('issues-opened', 'gitlab', false, true),
('issues-closed', 'gitlab', false, true),
('issue-comment', 'gitlab', false, true),

-- Confluence platform (Collaboration)
INSERT INTO "activityTypes" ("activityType", platform, "isCodeContribution", "isCollaboration") VALUES
('page-created', 'confluence', false, true),
('page-updated', 'confluence', false, true),
('comment-created', 'confluence', false, true),
('attachment-created', 'confluence', false, true),
('blogpost-created', 'confluence', false, true),
('blogpost-updated', 'confluence', false, true),
('attachment', 'confluence', false, true),
('comment', 'confluence', false, true);

-- Jira platform (Collaboration)
INSERT INTO "activityTypes" ("activityType", platform, "isCodeContribution", "isCollaboration") VALUES
('issue-created', 'jira', false, true),
('issue-closed', 'jira', false, true),
('issue-assigned', 'jira', false, true),
('issue-updated', 'jira', false, true),
('issue-comment-created', 'jira', false, true),
('issue-comment-updated', 'jira', false, true),
('issue-attachment-added', 'jira', false, true);

-- Groups.io platform (Collaboration)
INSERT INTO "activityTypes" ("activityType", platform, "isCodeContribution", "isCollaboration") VALUES
('message', 'groups.io', false, true);

-- Discord platform (Collaboration)
INSERT INTO "activityTypes" ("activityType", platform, "isCodeContribution", "isCollaboration") VALUES
('message', 'discord', false, true),
('thread_started', 'discord', false, true),
('thread_message', 'discord', false, true);

-- Slack platform (Collaboration)
INSERT INTO "activityTypes" ("activityType", platform, "isCodeContribution", "isCollaboration") VALUES
('message', 'slack', false, true);

-- Stack Overflow platform (Collaboration)
INSERT INTO "activityTypes" ("activityType", platform, "isCodeContribution", "isCollaboration") VALUES
('question', 'stackoverflow', false, true),
('answer', 'stackoverflow', false, true);

ALTER PUBLICATION sequin_pub ADD TABLE "activityTypes";
ALTER TABLE "activityTypes" REPLICA IDENTITY FULL;
GRANT SELECT ON "activityTypes" to sequin;
