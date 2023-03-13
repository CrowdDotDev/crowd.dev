import { PlatformType } from "./integrationEnums"


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
  default: string,
  short: string
  formatter?: { [key: string]: (string: string) => string }
}



export enum DevtoActivityType {
  COMMENT = 'comment',
}

export enum DiscordtoActivityType {
  JOINED_GUILD = 'joined_guild',
  MESSAGE = 'message',
  THREAD_STARTED = 'thread_started',  
  THREAD_MESSAGE = 'thread_message'
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
}

export const DEFAULT_ACTIVITY_TYPE_SETTINGS: DefaultActivityTypes = {
  [PlatformType.GITHUB]: {
    [GithubActivityType.DISCUSSION_STARTED]: {
      default: 'started a discussion in {{self.channel}}',
      short: 'TBD'
    },
    [GithubActivityType.DISCUSSION_COMMENT]: {
      default: 'commented on a discussion',
      short: 'TBD'
    },
    [GithubActivityType.FORK]: {
      default: 'forked {{self.channel}}',
      short: 'TBD'
    },
    [GithubActivityType.ISSUE_CLOSED]: {
      default: 'closed an issue',
      short: 'TBD'
    },
    [GithubActivityType.ISSUE_OPENED]: {
      default: 'opened a new issue in <a href="{url}">{channel}</a>',
      short: 'TBD',
      formatter: {
        channel: (string) => (string.split("/"))[1]
      }
    },
    [GithubActivityType.ISSUE_COMMENT]: {
      default: 'commented on an issue',
      short: 'TBD'
    },
    [GithubActivityType.PULL_REQUEST_CLOSED]: {
      default: 'closed a pull request',
      short: 'TBD'
    },
    [GithubActivityType.PULL_REQUEST_OPENED]: {
      default: 'opened a new pull request',
      short: 'TBD'
    },
    [GithubActivityType.PULL_REQUEST_COMMENT]: {
      default: 'commented on a pull request',
      short: 'TBD'
    },
    [GithubActivityType.STAR]: {
      default: 'starred',
      short: 'TBD'
    },
    [GithubActivityType.UNSTAR]: {
      default: 'unstarred',
      short: 'TBD'
    },
  },
  [PlatformType.DEVTO]: {
    [DevtoActivityType.COMMENT]: {
      default: 'comment',
      short: 'TBD'
    },
  },
  [PlatformType.DISCORD]: {
    [DiscordtoActivityType.JOINED_GUILD]: {
      default: 'joined server',
      short: 'TBD'
    },
    [DiscordtoActivityType.MESSAGE]: {
      default: 'sent a message in {attributes.parentChannel}',
      short: 'TBD'
    },
    [DiscordtoActivityType.THREAD_STARTED]: {
      default: 'started a new thread',
      short: 'TBD'
    },
    [DiscordtoActivityType.THREAD_MESSAGE]: {
      default: 'replied to a message in thread {channel} -> {attributes.parentChannel}',
      short: 'TBD'
    },
  },
  [PlatformType.HACKERNEWS]: {
    [HackerNewsActivityType.COMMENT]: {
      default: 'commented',
      short: 'TBD'
    },
    [HackerNewsActivityType.POST]: {
      default: 'posted',
      short: 'TBD'
    },
  },
  [PlatformType.LINKEDIN]: {
    [LinkedinActivityType.COMMENT]: {
      default: 'commented',
      short: 'TBD'
    },
    [LinkedinActivityType.MESSAGE]: {
      default: 'sent a message',
      short: 'TBD'
    },
    [LinkedinActivityType.REACTION]: {
      default: 'reacted',
      short: 'TBD'
    },
  },
  [PlatformType.REDDIT]: {
    [RedditActivityType.COMMENT]: {
      default: 'commented',
      short: 'TBD'
    },
    [RedditActivityType.POST]: {
      default: 'posted',
      short: 'TBD'
    },
  },
  [PlatformType.SLACK]: {
    [SlackActivityType.JOINED_CHANNEL]: {
      default: 'joined channel',
      short: 'TBD'
    },
    [SlackActivityType.MESSAGE]: {
      default: 'sent a message',
      short: 'TBD'
    }
  },
  [PlatformType.TWITTER]: {
    [TwitterActivityType.HASHTAG]: {
      default: 'posted a tweet',
      short: 'TBD'
    },
    [TwitterActivityType.MENTION]: {
      default: 'mentioned you in a tweet',
      short: 'TBD'
    },
  }

}
