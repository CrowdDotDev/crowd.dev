# @crowd/slack

Slack helpers shared by the backend and the workers.

- `notify.ts` / `channels.ts`: alerts sent through incoming webhooks (`<CHANNEL>_SLACK_WEBHOOK_URL`). They belong to the "CM Notifications" app and are independent from the bot below.
- `chatClient.ts`: bot client (`chat.postMessage`, `chat.update`, `chat.getPermalink`) used by the onboarding bot.
- `reviewRequest.ts`: Approve / Reject card posted to the review channel.
- `threadReply.ts`: replies in the thread of the original request.

## The "LFX Onboarding" Slack app

The onboarding bot runs on a dedicated Slack app. `slack-app.manifest.yml` recreates it from
api.slack.com/apps → Create New App → From a manifest. Replace the `cm.lfx.dev/api` host for
other environments. The slash command is `/crowd` in production, `/crowd-staging` in staging and
`/crowd-test` locally (`backend/src/services/slackCommandService.ts`).

What the code expects from the app:

| Feature           | Value                                                     | Handled in                               |
| ----------------- | --------------------------------------------------------- | ---------------------------------------- |
| Bot event         | `app_mention`                                             | `backend/src/api/slack/events.ts`        |
| Events URL        | `https://<api-host>/v1/slack/events`                      | `backend/src/api/slack/index.ts`         |
| Interactivity URL | `https://<api-host>/v1/slack/interactivity`               | `backend/src/api/slack/interactivity.ts` |
| Slash command URL | `https://<api-host>/slack/commands`                       | `backend/src/api/slack/command.ts`       |
| Bot scopes        | `app_mentions:read chat:write chat:write.public commands` | `chatClient.ts`                          |

The bot must be invited to every channel it answers in (`/invite @LFX Onboarding`), including the
review channel.

## Environment variables

All bot features share one app: the signing secret that verifies button clicks must belong to the
same app as the bot token that posted the message and as the app id checked on slash commands.

| Variable                           | backend | projects_evaluation_worker | automatic_onboarding_worker | Where to find it in the app                |
| ---------------------------------- | ------- | -------------------------- | --------------------------- | ------------------------------------------ |
| `CROWD_SLACK_BOT_TOKEN`            | yes     | yes                        | yes                         | OAuth & Permissions → Bot User OAuth Token |
| `CROWD_SLACK_SIGNING_SECRET`       | yes     |                            |                             | Basic Information → Signing Secret         |
| `CROWD_SLACK_REVIEW_CHANNEL_ID`    |         | yes                        |                             | Channel id of the review channel           |
| `CROWD_SLACK_ONBOARDING_APP_ID`    | yes     |                            |                             | Basic Information → App ID                 |
| `CROWD_SLACK_ONBOARDING_APP_TOKEN` | yes     |                            |                             | Basic Information → Verification Token     |
| `CROWD_SLACK_ONBOARDING_TEAM_ID`   | yes     |                            |                             | Workspace id (`T…`)                        |

`CROWD_SLACK_BOT_TOKEN` and `CROWD_SLACK_SIGNING_SECRET` are read by `getSlackBotConfig()`; when one
is missing the Slack routes are not mounted and the bot client is disabled, with a warning at
startup. The `CROWD_SLACK_ONBOARDING_*` values are read through node-config in
`backend/config/custom-environment-variables.json`.

Switching the app (new tokens and secret) invalidates the buttons on cards posted by the previous
app, so decide every open review before the switch.
