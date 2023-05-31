import { ActivityTypeDisplayProperties, DefaultActivityTypes, PlatformType } from '@crowd/types'
import { DevToActivityType } from './devto/types'
import { GithubActivityType } from './github/types'
import { LinkedinActivityType } from './premium/linkedin/types'
import { StackOverflowActivityType } from './stackoverflow/types'
import { TwitterActivityType } from './twitter/types'
import { SlackActivityType } from './slack/types'
import { GitActivityType } from './git/types'
import { RedditActivityType } from './reddit/types'
import { HackerNewsActivityType } from './hackernews/types'
import { isUrl } from '@crowd/common'
import { DiscordActivityType } from './discord/types'
import { GITHUB_GRID } from './github/grid'
import { DEVTO_GRID } from './devto/grid'
import { DISCORD_GRID } from './discord/grid'
import { HACKERNEWS_GRID } from './hackernews/grid'
import { LINKEDIN_GRID } from './premium/linkedin/grid'
import { REDDIT_GRID } from './reddit/grid'
import { SLACK_GRID } from './slack/grid'
import { TWITTER_GRID } from './twitter/grid'
import { STACKOVERFLOW_GRID } from './stackoverflow/grid'
import { DiscourseActivityType } from './discourse/types'
import { DISCOURSE_GRID } from './discourse/grid'

export const UNKNOWN_ACTIVITY_TYPE_DISPLAY: ActivityTypeDisplayProperties = {
  default: 'Conducted an activity',
  short: 'conducted an activity',
  channel: '',
}

const githubUrl = 'https://github.com'

const defaultGithubChannelFormatter = (channel) => {
  const channelSplit = channel.split('/')
  const organization = channelSplit[3]
  const repo = channelSplit[4]
  return `<a href="${githubUrl}/${organization}/${repo}" target="_blank">${repo}</a>`
}

const defaultStackoverflowFormatter = (activity) => {
  if (activity.attributes.keywordMentioned && activity.attributes.tagMentioned) {
    return `<span class="gray notruncate">tagged with "${activity.attributes.tagMentioned}" and mentioning "${activity.attributes.keywordMentioned}"</span>`
  }

  if (activity.attributes.keywordMentioned) {
    return `<span class="gray notruncate">mentioning "${activity.attributes.keywordMentioned}"</span>`
  }

  if (activity.attributes.tagMentioned) {
    return `<span class="gray notruncate">tagged with "${activity.attributes.tagMentioned}"</span>`
  }

  return ''
}

const cleanDiscourseUrl = (url) => {
  // https://discourse-web-aah2.onrender.com/t/test-webhook-topic-cool/26/5 -> remove /5 so only url to topic remains
  const urlSplit = url.split('/')
  urlSplit.pop()
  return urlSplit.join('/')
}

const defaultDiscourseFormatter = (activity) => {
  const topicUrl = cleanDiscourseUrl(activity.url)
  return `<a href="${topicUrl}" target="_blank">#${activity.channel}</a>`
}

export const DEFAULT_ACTIVITY_TYPE_SETTINGS: DefaultActivityTypes = {
  [PlatformType.GITHUB]: {
    [GithubActivityType.DISCUSSION_STARTED]: {
      display: {
        default: 'started a discussion in {channel}',
        short: 'started a discussion',
        channel: '{channel}',
        formatter: {
          channel: defaultGithubChannelFormatter,
        },
      },
      isContribution: GITHUB_GRID[GithubActivityType.DISCUSSION_STARTED].isContribution,
    },
    [GithubActivityType.DISCUSSION_COMMENT]: {
      display: {
        default: 'commented on a discussion in {channel}',
        short: 'commented on a discussion',
        channel: '{channel}',
        formatter: {
          channel: defaultGithubChannelFormatter,
        },
      },
      isContribution: GITHUB_GRID[GithubActivityType.DISCUSSION_COMMENT].isContribution,
    },
    [GithubActivityType.FORK]: {
      display: {
        default: 'forked {channel}',
        short: 'forked',
        channel: '{channel}',
        formatter: {
          channel: defaultGithubChannelFormatter,
        },
      },
      isContribution: GITHUB_GRID.fork.isContribution,
    },
    [GithubActivityType.ISSUE_CLOSED]: {
      display: {
        default: 'closed an issue in {channel}',
        short: 'closed an issue',
        channel: '{channel}',
        formatter: {
          channel: defaultGithubChannelFormatter,
        },
      },
      isContribution: GITHUB_GRID[GithubActivityType.ISSUE_CLOSED].isContribution,
    },
    [GithubActivityType.ISSUE_OPENED]: {
      display: {
        default: 'opened a new issue in {channel}',
        short: 'opened an issue',
        channel: '{channel}',
        formatter: {
          channel: defaultGithubChannelFormatter,
        },
      },
      isContribution: GITHUB_GRID[GithubActivityType.ISSUE_OPENED].isContribution,
    },
    [GithubActivityType.ISSUE_COMMENT]: {
      display: {
        default: 'commented on an issue in {channel}',
        short: 'commented on an issue',
        channel: '{channel}',
        formatter: {
          channel: defaultGithubChannelFormatter,
        },
      },
      isContribution: GITHUB_GRID[GithubActivityType.ISSUE_COMMENT].isContribution,
    },
    [GithubActivityType.PULL_REQUEST_CLOSED]: {
      display: {
        default: 'closed a pull request in {channel}',
        short: 'closed a pull request',
        channel: '{channel}',
        formatter: {
          channel: defaultGithubChannelFormatter,
        },
      },
      isContribution: GITHUB_GRID[GithubActivityType.PULL_REQUEST_CLOSED].isContribution,
    },
    [GithubActivityType.PULL_REQUEST_OPENED]: {
      display: {
        default: 'opened a new pull request in {channel}',
        short: 'opened a pull request',
        channel: '{channel}',
        formatter: {
          channel: defaultGithubChannelFormatter,
        },
      },
      isContribution: GITHUB_GRID[GithubActivityType.PULL_REQUEST_OPENED].isContribution,
    },
    [GithubActivityType.PULL_REQUEST_COMMENT]: {
      display: {
        default: 'commented on a pull request in {channel}',
        short: 'commented on a pull request',
        channel: '{channel}',
        formatter: {
          channel: defaultGithubChannelFormatter,
        },
      },
      isContribution: GITHUB_GRID[GithubActivityType.PULL_REQUEST_COMMENT].isContribution,
    },
    [GithubActivityType.STAR]: {
      display: {
        default: 'starred {channel}',
        short: 'starred',
        channel: '{channel}',
        formatter: {
          channel: defaultGithubChannelFormatter,
        },
      },
      isContribution: GITHUB_GRID[GithubActivityType.STAR].isContribution,
    },
    [GithubActivityType.UNSTAR]: {
      display: {
        default: 'unstarred {channel}',
        short: 'unstarred',
        channel: '{channel}',
        formatter: {
          channel: defaultGithubChannelFormatter,
        },
      },
      isContribution: GITHUB_GRID[GithubActivityType.UNSTAR].isContribution,
    },
    [GithubActivityType.PULL_REQUEST_MERGED]: {
      display: {
        default: 'merged pull request {self}',
        short: 'merged a pull request',
        channel: '{channel}',
        formatter: {
          channel: defaultGithubChannelFormatter,
          self: (activity) => {
            const prNumberAndTitle = `#${activity.url.split('/')[6]} ${activity.parent.title}`
            return `<a href="${activity.url}" target="_blank">${prNumberAndTitle}</a>`
          },
        },
      },
      isContribution: GITHUB_GRID[GithubActivityType.PULL_REQUEST_MERGED].isContribution,
    },
    [GithubActivityType.PULL_REQUEST_ASSIGNED]: {
      display: {
        default: 'assigned pull request {self}',
        short: 'assigned a pull request',
        channel: '{channel}',
        formatter: {
          channel: defaultGithubChannelFormatter,
          self: (activity) => {
            const prNumberAndTitle = `#${activity.url.split('/')[6]} ${activity.parent.title}`
            return `<a href="${activity.url}" style="max-width:150px" target="_blank">${prNumberAndTitle}</a> to <a href="/members/${activity.objectMemberId}" target="_blank">${activity.objectMember.displayName}</a>`
          },
        },
      },
      isContribution: GITHUB_GRID[GithubActivityType.PULL_REQUEST_ASSIGNED].isContribution,
    },
    [GithubActivityType.PULL_REQUEST_REVIEWED]: {
      display: {
        default: 'reviewed pull request {self}',
        short: 'reviewed a pull request',
        channel: '{channel}',
        formatter: {
          channel: defaultGithubChannelFormatter,
          self: (activity) => {
            const prNumberAndTitle = `#${activity.url.split('/')[6]} ${activity.parent.title}`
            return `<a href="${activity.url}" target="_blank">${prNumberAndTitle}</a>`
          },
        },
      },
      isContribution: GITHUB_GRID[GithubActivityType.PULL_REQUEST_REVIEWED].isContribution,
    },
    [GithubActivityType.PULL_REQUEST_REVIEW_REQUESTED]: {
      display: {
        default: 'requested a review for pull request {self}',
        short: 'requested a pull request review',
        channel: '{channel}',
        formatter: {
          channel: defaultGithubChannelFormatter,
          self: (activity) => {
            const prNumberAndTitle = `#${activity.url.split('/')[6]} ${activity.parent.title}`
            return `<a href="${activity.url}" style="max-width:150px" target="_blank">${prNumberAndTitle}</a> from <a href="/members/${activity.objectMemberId}" target="_blank">${activity.objectMember.displayName}</a>`
          },
        },
      },
      isContribution: GITHUB_GRID[GithubActivityType.PULL_REQUEST_REVIEW_REQUESTED].isContribution,
    },
    [GithubActivityType.PULL_REQUEST_REVIEW_THREAD_COMMENT]: {
      display: {
        default: 'commented while reviewing pull request {self}',
        short: 'commented on a pull request review',
        channel: '{channel}',
        formatter: {
          channel: defaultGithubChannelFormatter,
          self: (activity) => {
            const prNumberAndTitle = `#${activity.url.split('/')[6].split('#')[0]} ${
              activity.parent.title
            }`
            return `<a href="${activity.url}" style="max-width:150px" target="_blank">${prNumberAndTitle}</a>`
          },
        },
      },
      isContribution:
        GITHUB_GRID[GithubActivityType.PULL_REQUEST_REVIEW_THREAD_COMMENT].isContribution,
    },
  },
  [PlatformType.GIT]: {
    [GitActivityType.AUTHORED_COMMIT]: {
      display: {
        default: 'authored a commit in {channel}',
        short: 'authored a commit',
        channel: '{channel}',
      },
      isContribution: true,
    },
    [GitActivityType.REVIEWED_COMMIT]: {
      display: {
        default: 'reviewed a commit in {channel}',
        short: 'reviewed a commit',
        channel: '{channel}',
      },
      isContribution: true,
    },
    [GitActivityType.TESTED_COMMIT]: {
      display: {
        default: 'tested a commit in {channel}',
        short: 'tested a commit',
        channel: '{channel}',
      },
      isContribution: true,
    },
    [GitActivityType.CO_AUTHORED_COMMIT]: {
      display: {
        default: 'co-authored a commit in {channel}',
        short: 'co-authored a commit',
        channel: '{channel}',
      },
      isContribution: true,
    },
    [GitActivityType.INFORMED_COMMIT]: {
      display: {
        default: 'informed a commit in {channel}',
        short: 'informed a commit',
        channel: '{channel}',
      },
      isContribution: true,
    },
    [GitActivityType.INFLUENCED_COMMIT]: {
      display: {
        default: 'influenced a commit in {channel}',
        short: 'influenced a commit',
        channel: '{channel}',
      },
      isContribution: true,
    },
    [GitActivityType.APPROVED_COMMIT]: {
      display: {
        default: 'approved a commit in {channel}',
        short: 'approved a commit',
        channel: '{channel}',
      },
      isContribution: true,
    },
    [GitActivityType.COMMITTED_COMMIT]: {
      display: {
        default: 'committed a commit in {channel}',
        short: 'committed a commit',
        channel: '{channel}',
      },
      isContribution: true,
    },
    [GitActivityType.REPORTED_COMMIT]: {
      display: {
        default: 'reported a commit in {channel}',
        short: 'reported a commit',
        channel: '{channel}',
      },
      isContribution: true,
    },
    [GitActivityType.RESOLVED_COMMIT]: {
      display: {
        default: 'resolved a commit in {channel}',
        short: 'resolved a commit',
        channel: '{channel}',
      },
      isContribution: true,
    },
    [GitActivityType.SIGNED_OFF_COMMIT]: {
      display: {
        default: 'signed off a commit in {channel}',
        short: 'signed off a commit',
        channel: '{channel}',
      },
      isContribution: true,
    },
  },
  [PlatformType.DEVTO]: {
    [DevToActivityType.COMMENT]: {
      display: {
        default:
          'commented on <a href="{attributes.articleUrl}" class="truncate max-w-2xs">{attributes.articleTitle}</a>',
        short: 'commented',
        channel:
          '<a href="{attributes.articleUrl}" class="truncate max-w-2xs">{attributes.articleTitle}</a>',
      },
      isContribution: DEVTO_GRID[DevToActivityType.COMMENT].isContribution,
    },
  },
  [PlatformType.DISCORD]: {
    [DiscordActivityType.JOINED_GUILD]: {
      display: {
        default: 'joined server',
        short: 'joined server',
        channel: '',
      },
      isContribution: DISCORD_GRID[DiscordActivityType.JOINED_GUILD].isContribution,
    },
    [DiscordActivityType.MESSAGE]: {
      display: {
        default:
          'sent a message in <span class="text-brand-500 truncate max-w-2xs">#{channel}</span>',
        short: 'sent a message',
        channel: '<span class="text-brand-500 truncate max-w-2xs">#{channel}</span>',
      },
      isContribution: DISCORD_GRID[DiscordActivityType.MESSAGE].isContribution,
    },
    [DiscordActivityType.THREAD_STARTED]: {
      display: {
        default: 'started a new thread',
        short: 'started a new thread',
        channel: '',
      },
      isContribution: DISCORD_GRID[DiscordActivityType.THREAD_STARTED].isContribution,
    },
    [DiscordActivityType.THREAD_MESSAGE]: {
      display: {
        default:
          'replied to a message in thread <span class="text-brand-500 truncate max-w-2xs">#{channel}</span> -> <span class="text-brand-500">{attributes.childChannel}</span>',
        short: 'replied to a message',
        channel:
          '<span class="text-brand-500 truncate max-w-2xs">thread #{channel}</span> -> <span class="text-brand-500">#{attributes.childChannel}</span>',
      },
      isContribution: DISCORD_GRID[DiscordActivityType.THREAD_MESSAGE].isContribution,
    },
  },
  [PlatformType.HACKERNEWS]: {
    [HackerNewsActivityType.COMMENT]: {
      display: {
        default:
          'commented on <a href="{attributes.parentUrl}" target="_blank">{attributes.parentTitle}</a>',
        short: 'commented',
        channel: '{channel}',
        formatter: {
          channel: (channel) => {
            if (isUrl(channel)) {
              return `<a href="https://${channel}">${channel}</a>`
            }
            return `<a href="">${channel}</a>`
          },
        },
      },
      isContribution: HACKERNEWS_GRID[HackerNewsActivityType.COMMENT].isContribution,
    },
    [HackerNewsActivityType.POST]: {
      display: {
        default: 'posted mentioning {channel}',
        short: 'posted',
        channel: '{channel}',
        formatter: {
          channel: (channel) => {
            if (isUrl(channel)) {
              return `<a href="https://${channel}">${channel}</a>`
            }
            return `<a href="">${channel}</a>`
          },
        },
      },
      isContribution: HACKERNEWS_GRID[HackerNewsActivityType.POST].isContribution,
    },
  },
  [PlatformType.LINKEDIN]: {
    [LinkedinActivityType.COMMENT]: {
      display: {
        default:
          'commented on a post <a href="{attributes.postUrl}" target="_blank">{attributes.postBody}</a>',
        short: 'commented',
        channel: '<a href="{attributes.postUrl}" target="_blank">{attributes.postBody}</a>',
      },
      isContribution: LINKEDIN_GRID[LinkedinActivityType.COMMENT].isContribution,
    },
    [LinkedinActivityType.REACTION]: {
      display: {
        default:
          'reacted with <img src="/images/integrations/linkedin-reactions/{attributes.reactionType}.svg"> on a post <a href="{attributes.postUrl}" target="_blank">{attributes.postBody}</a>',
        short: 'reacted',
        channel: '<a href="{attributes.postUrl}" target="_blank">{attributes.postBody}</a>',
      },
      isContribution: LINKEDIN_GRID[LinkedinActivityType.REACTION].isContribution,
    },
  },
  [PlatformType.REDDIT]: {
    [RedditActivityType.COMMENT]: {
      display: {
        default:
          'commented in subreddit <a href="https://reddit.com/r/{channel}" target="_blank">r/{channel}</a>',
        short: 'commented on a post',
        channel: '<a href="https://reddit.com/r/{channel}" target="_blank">r/{channel}</a>',
      },
      isContribution: REDDIT_GRID[RedditActivityType.COMMENT].isContribution,
    },
    [RedditActivityType.POST]: {
      display: {
        default:
          'posted in subreddit <a href="https://reddit.com/r/{channel}" target="_blank">r/{channel}</a>',
        short: 'posted in subreddit',
        channel: '<a href="https://reddit.com/r/{channel}" target="_blank">r/{channel}</a>',
      },
      isContribution: REDDIT_GRID[RedditActivityType.POST].isContribution,
    },
  },
  [PlatformType.SLACK]: {
    [SlackActivityType.JOINED_CHANNEL]: {
      display: {
        default: 'joined channel {channel}',
        short: 'joined channel',
        channel: '{channel}',
        formatter: {
          channel: (channel) => {
            if (channel) {
              return `<span class="text-brand-500 truncate max-w-2xs">#${channel}</span>`
            }
            return ''
          },
        },
      },
      isContribution: SLACK_GRID[SlackActivityType.JOINED_CHANNEL].isContribution,
    },
    [SlackActivityType.MESSAGE]: {
      display: {
        default: 'sent a message in {channel}',
        short: 'sent a message',
        channel: '{channel}',
        formatter: {
          channel: (channel) => {
            if (channel) {
              return `<span class="text-brand-500 truncate max-w-2xs">#${channel}</span>`
            }
            return ''
          },
        },
      },
      isContribution: SLACK_GRID[SlackActivityType.MESSAGE].isContribution,
    },
  },
  [PlatformType.TWITTER]: {
    [TwitterActivityType.HASHTAG]: {
      display: {
        default: 'posted a tweet',
        short: 'posted a tweet',
        channel: '',
      },
      isContribution: TWITTER_GRID[TwitterActivityType.HASHTAG].isContribution,
    },
    [TwitterActivityType.FOLLOW]: {
      display: {
        default: 'followed you',
        short: 'followed you',
        channel: '',
      },
      isContribution: TWITTER_GRID[TwitterActivityType.FOLLOW].isContribution,
    },
    [TwitterActivityType.MENTION]: {
      display: {
        default: 'mentioned you in a tweet',
        short: 'mentioned you',
        channel: '',
      },
      isContribution: TWITTER_GRID[TwitterActivityType.MENTION].isContribution,
    },
  },
  [PlatformType.STACKOVERFLOW]: {
    [StackOverflowActivityType.QUESTION]: {
      display: {
        default: 'Asked a question {self}',
        short: 'asked a question',
        channel: '',
        formatter: {
          self: defaultStackoverflowFormatter,
        },
      },
      isContribution: STACKOVERFLOW_GRID[StackOverflowActivityType.QUESTION].isContribution,
    },
    [StackOverflowActivityType.ANSWER]: {
      display: {
        default: 'Answered a question {self}',
        short: 'answered a question',
        channel: '',
        formatter: {
          self: defaultStackoverflowFormatter,
        },
      },
      isContribution: STACKOVERFLOW_GRID[StackOverflowActivityType.ANSWER].isContribution,
    },
  },
  [PlatformType.DISCOURSE]: {
    [DiscourseActivityType.CREATE_TOPIC]: {
      display: {
        default: 'Created a topic {self}',
        short: 'created a topic',
        channel: '<span class="text-brand-500 truncate max-w-2xs">#{channel}</span>',
        formatter: {
          self: defaultDiscourseFormatter,
        },
      },
      isContribution: DISCOURSE_GRID[DiscourseActivityType.CREATE_TOPIC].isContribution,
    },
    [DiscourseActivityType.MESSAGE_IN_TOPIC]: {
      display: {
        default: 'Posted a message in {self}',
        short: 'posted a message',
        channel: '<span class="text-brand-500 truncate max-w-2xs">#{channel}</span>',
        formatter: {
          self: defaultDiscourseFormatter,
        },
      },
      isContribution: DISCOURSE_GRID[DiscourseActivityType.MESSAGE_IN_TOPIC].isContribution,
    },
    [DiscourseActivityType.JOIN]: {
      display: {
        default: 'Joined a forum',
        short: 'joined a forum',
        channel: '',
      },
      isContribution: DISCOURSE_GRID[DiscourseActivityType.JOIN].isContribution,
    },
    [DiscourseActivityType.LIKE]: {
      display: {
        default: 'Liked a post in {self}',
        short: 'liked a post',
        channel: '<span class="text-brand-500 truncate max-w-2xs">#{channel}</span>',
        formatter: {
          self: (activity) =>
            `<a href="${activity.attributes.topicURL}" target="_blank">#${activity.channel}</a>`,
        },
      },
      isContribution: DISCOURSE_GRID[DiscourseActivityType.LIKE].isContribution,
    },
  },
}
