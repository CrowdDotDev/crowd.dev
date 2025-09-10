CREATE TABLE activity_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    activity_type VARCHAR(150),
    platform VARCHAR(150),
    is_code_contribution BOOLEAN,
    is_collaboration BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_activity_types_activity_type
    ON activity_types (activity_type);


-- Insert Code Contributions activity types
-- Git platform (Code Contributions)
INSERT INTO activity_types (activity_type, platform, is_code_contribution, is_collaboration) VALUES
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
INSERT INTO activity_types (activity_type, platform, is_code_contribution, is_collaboration) VALUES
('pull_request-opened', 'github', true, false),
('pull_request-closed', 'github', true, false),
('pull_request-review-requested', 'github', true, false),
('pull_request-reviewed', 'github', true, false),
('pull_request-merged', 'github', true, false),
('pull_request-comment', 'github', true, false),
('authored-commit', 'github', true, false);

-- Gerrit platform (Code Contributions)
INSERT INTO activity_types (activity_type, platform, is_code_contribution, is_collaboration) VALUES
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
INSERT INTO activity_types (activity_type, platform, is_code_contribution, is_collaboration) VALUES
('merge_request-opened', 'gitlab', true, false),
('merge_request-closed', 'gitlab', true, false),
('merge_request-review-requested', 'gitlab', true, false),
('merge_request-review-approved', 'gitlab', true, false),
('merge_request-review-changes-requested', 'gitlab', true, false),
('merge_request-merged', 'gitlab', true, false),
('merge_request-comment', 'gitlab', true, false);

-- Insert Collaboration activity types
-- GitHub platform (Collaboration)
INSERT INTO activity_types (activity_type, platform, is_code_contribution, is_collaboration) VALUES
('discussion-started', 'github', false, true),
('issues-opened', 'github', false, true),
('issues-closed', 'github', false, true),
('issue-comment', 'github', false, true),
('discussion-comment', 'github', false, true);

-- GitLab platform (Collaboration)
INSERT INTO activity_types (activity_type, platform, is_code_contribution, is_collaboration) VALUES
('issues-opened', 'gitlab', false, true),
('issues-closed', 'gitlab', false, true),
('issue-comment', 'gitlab', false, true),
('authored-commit', 'gitlab', false, true);

-- Confluence platform (Collaboration)
INSERT INTO activity_types (activity_type, platform, is_code_contribution, is_collaboration) VALUES
('page-created', 'confluence', false, true),
('page-updated', 'confluence', false, true),
('comment-created', 'confluence', false, true),
('attachment-created', 'confluence', false, true),
('blogpost-created', 'confluence', false, true),
('blogpost-updated', 'confluence', false, true),
('attachment', 'confluence', false, true),
('comment', 'confluence', false, true);

-- Jira platform (Collaboration)
INSERT INTO activity_types (activity_type, platform, is_code_contribution, is_collaboration) VALUES
('issue-created', 'jira', false, true),
('issue-closed', 'jira', false, true),
('issue-assigned', 'jira', false, true),
('issue-updated', 'jira', false, true),
('issue-comment-created', 'jira', false, true),
('issue-comment-updated', 'jira', false, true),
('issue-attachment-added', 'jira', false, true);

-- Groups.io platform (Collaboration)
INSERT INTO activity_types (activity_type, platform, is_code_contribution, is_collaboration) VALUES
('message', 'groups.io', false, true);

-- Discord platform (Collaboration)
INSERT INTO activity_types (activity_type, platform, is_code_contribution, is_collaboration) VALUES
('message', 'discord', false, true),
('thread_started', 'discord', false, true),
('thread_message', 'discord', false, true);

-- Slack platform (Collaboration)
INSERT INTO activity_types (activity_type, platform, is_code_contribution, is_collaboration) VALUES
('message', 'slack', false, true);

-- Stack Overflow platform (Collaboration)
INSERT INTO activity_types (activity_type, platform, is_code_contribution, is_collaboration) VALUES
('question', 'stackoverflow', false, true),
('answer', 'stackoverflow', false, true);
