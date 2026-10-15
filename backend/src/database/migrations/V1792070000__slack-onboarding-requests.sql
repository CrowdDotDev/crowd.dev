-- One row per Slack request: the thread message the bot edits in place as the repos resolve.
CREATE TABLE public."slackOnboardingRequests" (
    "sourceUrl"      TEXT PRIMARY KEY,
    "channel"        TEXT NOT NULL,
    "messageTs"      TEXT NOT NULL,
    "header"         JSONB NOT NULL DEFAULT '{}'::jsonb,
    "doneNotifiedAt" TIMESTAMP WITH TIME ZONE,
    "createdAt"      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updatedAt"      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
