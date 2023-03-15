import isUrl from '../utils/isUrl'
import { PlatformType } from './integrationEnums'

export type ActivityTypeSettings = {
  default: DefaultActivityTypes
  custom: CustomActivityTypes
}

export type DefaultActivityTypes = {
  [key in PlatformType]?: {
    [key: string]: ActivityTypeDisplayProperties
  }
}

export type CustomActivityTypes = {
  [key: string]: {
    [key: string]: ActivityTypeDisplayProperties
  }
}

export type ActivityTypeDisplayProperties = {
  default: string
  short: string
  channel: string
  formatter?: { [key: string]: (string: string) => string }
}

export enum DevtoActivityType {
  COMMENT = 'comment',
}

export enum DiscordtoActivityType {
  JOINED_GUILD = 'joined_guild',
  MESSAGE = 'message',
  THREAD_STARTED = 'thread_started',
  THREAD_MESSAGE = 'thread_message',
}

export enum GithubActivityType {
  DISCUSSION_STARTED = 'discussion-started',
  PULL_REQUEST_OPENED = 'pull_request-opened',
  PULL_REQUEST_CLOSED = 'pull_request-closed',
  ISSUE_OPENED = 'issues-opened',
  ISSUE_CLOSED = 'issues-closed',
  FORK = 'fork',
  STAR = 'star',
  UNSTAR = 'unstar',
  PULL_REQUEST_COMMENT = 'pull_request-comment',
  ISSUE_COMMENT = 'issue-comment',
  DISCUSSION_COMMENT = 'discussion-comment',
}

export enum HackerNewsActivityType {
  POST = 'post',
  COMMENT = 'comment',
}

export enum LinkedinActivityType {
  MESSAGE = 'message',
  COMMENT = 'comment',
  REACTION = 'reaction',
}

export enum RedditActivityType {
  POST = 'post',
  COMMENT = 'comment',
}

export enum SlackActivityType {
  JOINED_CHANNEL = 'channel_joined',
  MESSAGE = 'message',
}

export enum TwitterActivityType {
  HASHTAG = 'hashtag',
  MENTION = 'mention',
  FOLLOW = 'follow',
}

const githubUrl = 'https://github.com'

export const DEFAULT_ACTIVITY_TYPE_SETTINGS: DefaultActivityTypes = {
  [PlatformType.GITHUB]: {
    [GithubActivityType.DISCUSSION_STARTED]: {
      default: 'started a discussion in <a href="{url}" target="_blank">{channel}</a>',
      short: 'started a discussion',
      channel: '<a href="{url}" target="_blank">{channel}</a>',
      formatter: {
        channel: (string) => string.split('/')[1],
        url: (string) => {
          const split = string.split('/')
          return `${githubUrl}/${split[3]}/${split[4]}`
        },
      },
    },
    [GithubActivityType.DISCUSSION_COMMENT]: {
      default: 'commented on a discussion in <a href="{url}" target="_blank">{channel}</a>',
      short: 'commented on a discussion',
      channel: '<a href="{url}" target="_blank">{channel}</a>',
      formatter: {
        channel: (string) => string.split('/')[1],
        url: (string) => {
          const split = string.split('/')
          return `${githubUrl}/${split[3]}/${split[4]}`
        },
      },
    },
    [GithubActivityType.FORK]: {
      default: 'forked <a href="{url}" target="_blank">{channel}</a>',
      short: 'forked',
      channel: '<a href="{url}" target="_blank">{channel}</a>',
      formatter: {
        channel: (string) => string.split('/')[1],
        url: (string) => {
          const split = string.split('/')
          return `${githubUrl}/${split[3]}/${split[4]}`
        },
      },
    },
    [GithubActivityType.ISSUE_CLOSED]: {
      default: 'closed an issue in <a href="{url}" target="_blank">{channel}</a>',
      short: 'closed an issue',
      channel: '<a href="{url}" target="_blank">{channel}</a>',
      formatter: {
        channel: (string) => string.split('/')[1],
        url: (string) => {
          const split = string.split('/')
          return `${githubUrl}/${split[3]}/${split[4]}`
        },
      },
    },
    [GithubActivityType.ISSUE_OPENED]: {
      default: 'opened a new issue in <a href="{url}" target="_blank">{channel}</a>',
      short: 'opened an issue',
      channel: '<a href="{url}" target="_blank">{channel}</a>',
      formatter: {
        channel: (string) => string.split('/')[1],
        url: (string) => {
          const split = string.split('/')
          return `${githubUrl}/${split[3]}/${split[4]}`
        },
      },
    },
    [GithubActivityType.ISSUE_COMMENT]: {
      default: 'commented on an issue in <a href="{url}" target="_blank">{channel}</a>',
      short: 'commented on an issue',
      channel: '<a href="{url}" target="_blank">{channel}</a>',
      formatter: {
        channel: (string) => string.split('/')[1],
        url: (string) => {
          const split = string.split('/')
          return `${githubUrl}/${split[3]}/${split[4]}`
        },
      },
    },
    [GithubActivityType.PULL_REQUEST_CLOSED]: {
      default: 'closed a pull request in <a href="{url}" target="_blank">{channel}</a>',
      short: 'closed a pull request',
      channel: '<a href="{url}" target="_blank">{channel}</a>',
      formatter: {
        channel: (string) => string.split('/')[1],
        url: (string) => {
          const split = string.split('/')
          return `${githubUrl}/${split[3]}/${split[4]}`
        },
      },
    },
    [GithubActivityType.PULL_REQUEST_OPENED]: {
      default: 'opened a new pull request in <a href="{url}" target="_blank">{channel}</a>',
      short: 'opened a pull request',
      channel: '<a href="{url}" target="_blank">{channel}</a>',
      formatter: {
        channel: (string) => string.split('/')[1],
        url: (string) => {
          const split = string.split('/')
          return `${githubUrl}/${split[3]}/${split[4]}`
        },
      },
    },
    [GithubActivityType.PULL_REQUEST_COMMENT]: {
      default: 'commented on a pull request in <a href="{url}" target="_blank">{channel}</a>',
      short: 'commented on a pull request',
      channel: '<a href="{url}" target="_blank">{channel}</a>',
      formatter: {
        channel: (string) => string.split('/')[1],
        url: (string) => {
          const split = string.split('/')
          return `${githubUrl}/${split[3]}/${split[4]}`
        },
      },
    },
    [GithubActivityType.STAR]: {
      default: 'starred <a href="{url}" target="_blank">{channel}</a>',
      short: 'starred',
      channel: '<a href="{url}" target="_blank">{channel}</a>',
      formatter: {
        channel: (string) => string.split('/')[1],
        url: (string) => {
          const split = string.split('/')
          return `${githubUrl}/${split[3]}/${split[4]}`
        },
      },
    },
    [GithubActivityType.UNSTAR]: {
      default: 'unstarred <a href="{url}" target="_blank">{channel}</a>',
      short: 'unstarred',
      channel: '<a href="{url}" target="_blank">{channel}</a>',
      formatter: {
        channel: (string) => string.split('/')[1],
        url: (string) => {
          const split = string.split('/')
          return `${githubUrl}/${split[3]}/${split[4]}`
        },
      },
    },
  },
  [PlatformType.DEVTO]: {
    [DevtoActivityType.COMMENT]: {
      default:
        'commented on <a href="{attributes.articleUrl}" class="truncate max-w-2xs">{attributes.articleTitle}</a>',
      short: 'commented',
      channel:
        '<a href="{attributes.articleUrl}" class="truncate max-w-2xs">{attributes.articleTitle}</a>',
    },
  },
  [PlatformType.DISCORD]: {
    [DiscordtoActivityType.JOINED_GUILD]: {
      default: 'joined server',
      short: 'joined server',
      channel: '',
    },
    [DiscordtoActivityType.MESSAGE]: {
      default:
        'sent a message in <span class="text-brand-500 truncate max-w-2xs">#{channel}</span>',
      short: 'sent a message',
      channel: '<span class="text-brand-500 truncate max-w-2xs">#{channel}</span>',
    },
    [DiscordtoActivityType.THREAD_STARTED]: {
      default: 'started a new thread',
      short: 'started a new thread',
      channel: '',
    },
    [DiscordtoActivityType.THREAD_MESSAGE]: {
      default:
        'replied to a message in <span class="text-brand-500 truncate max-w-2xs">thread #{channel}</span> -> <span class="text-brand-500">{attributes.parentChannel}</span>',
      short: 'replied to a message',
      channel:
        '<span class="text-brand-500 truncate max-w-2xs">thread #{channel}</span> -> <span class="text-brand-500">#{attributes.parentChannel}</span>',
    },
  },
  [PlatformType.HACKERNEWS]: {
    [HackerNewsActivityType.COMMENT]: {
      default:
        'commented on <a href="{attributes.parentUrl}" target="_blank">{attributes.parentTitle}</a>',
      short: 'commented',
      channel: '{channel}',
      formatter: {
        channel: (channel) => {
          if (isUrl(channel)) {
            return `<a href="https://{channel}">{channel}</a>`
          }
          return `<a href="">{channel}</a>`
        },
      },
    },
    [HackerNewsActivityType.POST]: {
      default: 'posted mentioning <a href="https://{channel}">{channel}</a>',
      short: 'posted',
      channel: '{channel}',
      formatter: {
        channel: (channel) => {
          if (isUrl(channel)) {
            return `<a href="https://{channel}">{channel}</a>`
          }
          return `<a href="">{channel}</a>`
        },
      },
    },
  },
  [PlatformType.LINKEDIN]: {
    [LinkedinActivityType.COMMENT]: {
      default:
        'commented on a post <a href="{attributes.postUrl}" target="_blank">{attributes.postBody}</a>',
      short: 'commented',
      channel: '<a href="{attributes.postUrl}" target="_blank">{attributes.postBody}</a>',
    },
    [LinkedinActivityType.MESSAGE]: {
      default: 'sent a message',
      short: 'sent a message',
      channel: '',
    },
    [LinkedinActivityType.REACTION]: {
      default:
        'reacted with <img src="/images/integrations/linkedin-reactions/{attributes.reactionType}"> on a post <a href="{attributes.postUrl}" target="_blank">{attributes.postBody}</a>',
      short: 'reacted',
      channel: '<a href="{attributes.postUrl}" target="_blank">{attributes.postBody}</a>',
    },
  },
  [PlatformType.REDDIT]: {
    [RedditActivityType.COMMENT]: {
      default:
        'commented on <a href="{url}" target="_blank">{attributes.parentTitle|attributes.greatParentTitle}</a> in <a href="https://reddit.com/r/{channel}" target="_blank">r/{channel}</a>',
      short: 'commented on a post',
      channel:
        '<a href="{url}" target="_blank">{attributes.parentTitle|attributes.greatParentTitle}</a> in <a href="https://reddit.com/r/{channel}" target="_blank">r/{channel}</a>',
    },
    [RedditActivityType.POST]: {
      default:
        'posted in subreddit <a href="https://reddit.com/r/{channel}" target="_blank">/r/{channel}</a>',
      short: 'posted in subreddit',
      channel: '<a href="https://reddit.com/r/{channel}" target="_blank">/r/{channel}</a>',
    },
  },
  [PlatformType.SLACK]: {
    [SlackActivityType.JOINED_CHANNEL]: {
      default: 'joined channel <span class="text-brand-500 truncate max-w-2xs">#{channel}</span>',
      short: 'joined channel',
      channel: '<span class="text-brand-500 truncate max-w-2xs">#{channel}</span>',
    },
    [SlackActivityType.MESSAGE]: {
      default:
        'sent a message in <span class="text-brand-500 truncate max-w-2xs">#{channel}</span>',
      short: 'sent a message',
      channel: '<span class="text-brand-500 truncate max-w-2xs">#{channel}</span>',
    },
  },
  [PlatformType.TWITTER]: {
    [TwitterActivityType.HASHTAG]: {
      default: 'posted a tweet',
      short: 'posted a tweet',
      channel: '',
    },
    [TwitterActivityType.FOLLOW]: {
      default: 'followed you',
      short: 'followed you',
      channel: '',
    },
    [TwitterActivityType.MENTION]: {
      default: 'mentioned you in a tweet',
      short: 'mentioned you',
      channel: '',
    },
  },
}
