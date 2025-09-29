-- GitLab platform (Code Contributions)
INSERT INTO "activityTypes" ("activityType", platform, "isCodeContribution", "isCollaboration") VALUES
('authored-commit', 'gitlab', true, false);

-- Fix Groups.io platform name
UPDATE "activityTypes" SET platform = 'groupsio' WHERE platform = 'groups.io';

-- Discourse platform (Collaboration)
INSERT INTO "activityTypes" ("activityType", platform, "isCodeContribution", "isCollaboration") VALUES
('create_topic', 'discourse', false, true),
('message_in_topic', 'discourse', false, true);


-- Insert other activity types

-- Dev.to
INSERT INTO "activityTypes" ("activityType", platform, "isCodeContribution", "isCollaboration") VALUES
('comment', 'devto', false, false);

-- Discord
INSERT INTO "activityTypes" ("activityType", platform, "isCodeContribution", "isCollaboration") VALUES
('joined_guild', 'discord', false, false);

-- Discourse
INSERT INTO "activityTypes" ("activityType", platform, "isCodeContribution", "isCollaboration") VALUES
('join', 'discourse', false, false),
('like', 'discourse', false, false);

-- Github
INSERT INTO "activityTypes" ("activityType", platform, "isCodeContribution", "isCollaboration") VALUES
('pull_request-assigned', 'github', false, false),
('fork', 'github', false, false),
('star', 'github', false, false),
('unstar', 'github', false, false);

-- Gitlab
INSERT INTO "activityTypes" ("activityType", platform, "isCodeContribution", "isCollaboration") VALUES
('merge_request-assigned', 'gitlab', false, false),
('fork', 'gitlab', false, false),
('star', 'gitlab', false, false);

-- Groups.io
INSERT INTO "activityTypes" ("activityType", platform, "isCodeContribution", "isCollaboration") VALUES
('member_join', 'groupsio', false, false),
('member_leave', 'groupsio', false, false);

-- HackerNews
INSERT INTO "activityTypes" ("activityType", platform, "isCodeContribution", "isCollaboration") VALUES
('post', 'hackernews', false, false),
('comment', 'hackernews', false, false);

-- LinkedIn
INSERT INTO "activityTypes" ("activityType", platform, "isCodeContribution", "isCollaboration") VALUES
('comment', 'linkedin', false, false),
('reaction', 'linkedin', false, false);

-- Reddit
INSERT INTO "activityTypes" ("activityType", platform, "isCodeContribution", "isCollaboration") VALUES
('post', 'reddit', false, false),
('comment', 'reddit', false, false);

-- Slack
INSERT INTO "activityTypes" ("activityType", platform, "isCodeContribution", "isCollaboration") VALUES
('channel_joined', 'slack', false, false);

-- Twitter
INSERT INTO "activityTypes" ("activityType", platform, "isCodeContribution", "isCollaboration") VALUES
('hashtag', 'twitter', false, false),
('mention', 'twitter', false, false),
('follow', 'twitter', false, false);
