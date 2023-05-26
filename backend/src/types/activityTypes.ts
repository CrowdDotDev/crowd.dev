import { DevtoGrid } from '../serverless/integrations/grid/devtoGrid'
import { DiscordGrid } from '../serverless/integrations/grid/discordGrid'
import { GitHubGrid } from '../serverless/integrations/grid/githubGrid'
import { HackerNewsGrid } from '../serverless/integrations/grid/hackerNewsGrid'
import { LinkedInGrid } from '../serverless/integrations/grid/linkedinGrid'
import { RedditGrid } from '../serverless/integrations/grid/redditGrid'
import { SlackGrid } from '../serverless/integrations/grid/slackGrid'
import { StackOverflowGrid } from '../serverless/integrations/grid/stackOverflowGrid'
import { TwitterGrid } from '../serverless/integrations/grid/twitterGrid'
import { DiscourseGrid } from '../serverless/integrations/grid/discourseGrid'
import isUrl from '../utils/isUrl'
import { PlatformType } from './integrationEnums'

export enum ActivityDisplayVariant {
  DEFAULT = 'default',
  SHORT = 'short',
  CHANNEL = 'channel',
}

export type ActivityTypeSettings = {
  default: DefaultActivityTypes
  custom: CustomActivityTypes
}

export type DefaultActivityTypes = {
  [key in PlatformType]?: {
    [key: string]: {
      display: ActivityTypeDisplayProperties
      isContribution: boolean
    }
  }
}

export type CustomActivityTypes = {
  [key: string]: {
    [key: string]: {
      display: ActivityTypeDisplayProperties
      isContribution: boolean
    }
  }
}

export type ActivityTypeDisplayProperties = {
  [ActivityDisplayVariant.DEFAULT]: string
  [ActivityDisplayVariant.SHORT]: string
  [ActivityDisplayVariant.CHANNEL]: string
  formatter?: { [key: string]: (input: any) => string }
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

export enum GithubPullRequestEvents {
  REQUEST_REVIEW = 'ReviewRequestedEvent',
  REVIEW = 'PullRequestReview',
  ASSIGN = 'AssignedEvent',
  MERGE = 'MergedEvent',
  CLOSE = 'ClosedEvent',
}

export enum GithubActivityType {
  DISCUSSION_STARTED = 'discussion-started',
  PULL_REQUEST_OPENED = 'pull_request-opened',
  PULL_REQUEST_CLOSED = 'pull_request-closed',
  PULL_REQUEST_REVIEW_REQUESTED = 'pull_request-review-requested',
  PULL_REQUEST_REVIEWED = 'pull_request-reviewed',
  PULL_REQUEST_ASSIGNED = 'pull_request-assigned',
  PULL_REQUEST_MERGED = 'pull_request-merged',
  ISSUE_OPENED = 'issues-opened',
  ISSUE_CLOSED = 'issues-closed',
  FORK = 'fork',
  STAR = 'star',
  UNSTAR = 'unstar',
  PULL_REQUEST_COMMENT = 'pull_request-comment',
  PULL_REQUEST_REVIEW_THREAD_COMMENT = 'pull_request-review-thread-comment',
  ISSUE_COMMENT = 'issue-comment',
  DISCUSSION_COMMENT = 'discussion-comment',
}

export enum GitActivityType {
  AUTHORED_COMMIT = 'authored-commit',
  REVIEWED_COMMIT = 'reviewed-commit',
  TESTED_COMMIT = 'tested-commit',
  CO_AUTHORED_COMMIT = 'co-authored-commit',
  INFORMED_COMMIT = 'informed-commit',
  INFLUENCED_COMMIT = 'influenced-commit',
  APPROVED_COMMIT = 'approved-commit',
  COMMITTED_COMMIT = 'committed-commit',
  REPORTED_COMMIT = 'reported-commit',
  RESOLVED_COMMIT = 'resolved-commit',
  SIGNED_OFF_COMMIT = 'signed-off-commit',
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

export enum StackOverflowActivityType {
  QUESTION = 'question',
  ANSWER = 'answer',
}

export enum DiscourseActivityType {
  CREATE_TOPIC = 'create_topic',
  MESSAGE_IN_TOPIC = 'message_in_topic',
  JOIN = 'join',
  LIKE = 'like',
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

export const UNKNOWN_ACTIVITY_TYPE_DISPLAY: ActivityTypeDisplayProperties = {
  default: 'Conducted an activity',
  short: 'conducted an activity',
  channel: '',
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
      isContribution: GitHubGrid.discussionOpened.isContribution,
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
      isContribution: GitHubGrid.comment.isContribution,
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
      isContribution: GitHubGrid.fork.isContribution,
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
      isContribution: GitHubGrid.issueClosed.isContribution,
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
      isContribution: GitHubGrid.issueOpened.isContribution,
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
      isContribution: GitHubGrid.comment.isContribution,
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
      isContribution: GitHubGrid.pullRequestClosed.isContribution,
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
      isContribution: GitHubGrid.pullRequestOpened.isContribution,
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
      isContribution: GitHubGrid.comment.isContribution,
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
      isContribution: GitHubGrid.star.isContribution,
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
      isContribution: GitHubGrid.unStar.isContribution,
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
      isContribution: GitHubGrid.pullRequestMerged.isContribution,
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
      isContribution: GitHubGrid.pullRequestAssigned.isContribution,
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
      isContribution: GitHubGrid.pullRequestReviewed.isContribution,
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
      isContribution: GitHubGrid.pullRequestReviewRequested.isContribution,
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
      isContribution: GitHubGrid.pullRequestReviewRequested.isContribution,
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
    [DevtoActivityType.COMMENT]: {
      display: {
        default:
          'commented on <a href="{attributes.articleUrl}" class="truncate max-w-2xs">{attributes.articleTitle}</a>',
        short: 'commented',
        channel:
          '<a href="{attributes.articleUrl}" class="truncate max-w-2xs">{attributes.articleTitle}</a>',
      },
      isContribution: DevtoGrid.comment.isContribution,
    },
  },
  [PlatformType.DISCORD]: {
    [DiscordtoActivityType.JOINED_GUILD]: {
      display: {
        default: 'joined server',
        short: 'joined server',
        channel: '',
      },
      isContribution: DiscordGrid.join.isContribution,
    },
    [DiscordtoActivityType.MESSAGE]: {
      display: {
        default:
          'sent a message in <span class="text-brand-500 truncate max-w-2xs">#{channel}</span>',
        short: 'sent a message',
        channel: '<span class="text-brand-500 truncate max-w-2xs">#{channel}</span>',
      },
      isContribution: DiscordGrid.message.isContribution,
    },
    [DiscordtoActivityType.THREAD_STARTED]: {
      display: {
        default: 'started a new thread',
        short: 'started a new thread',
        channel: '',
      },
      isContribution: DiscordGrid.message.isContribution,
    },
    [DiscordtoActivityType.THREAD_MESSAGE]: {
      display: {
        default:
          'replied to a message in thread <span class="text-brand-500 truncate max-w-2xs">#{channel}</span> -> <span class="text-brand-500">{attributes.childChannel}</span>',
        short: 'replied to a message',
        channel:
          '<span class="text-brand-500 truncate max-w-2xs">thread #{channel}</span> -> <span class="text-brand-500">#{attributes.childChannel}</span>',
      },
      isContribution: DiscordGrid.message.isContribution,
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
      isContribution: HackerNewsGrid.comment.isContribution,
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
      isContribution: HackerNewsGrid.post.isContribution,
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
      isContribution: LinkedInGrid.comment.isContribution,
    },
    [LinkedinActivityType.REACTION]: {
      display: {
        default:
          'reacted with <img src="/images/integrations/linkedin-reactions/{attributes.reactionType}.svg"> on a post <a href="{attributes.postUrl}" target="_blank">{attributes.postBody}</a>',
        short: 'reacted',
        channel: '<a href="{attributes.postUrl}" target="_blank">{attributes.postBody}</a>',
      },
      isContribution: LinkedInGrid.reaction.isContribution,
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
      isContribution: RedditGrid.comment.isContribution,
    },
    [RedditActivityType.POST]: {
      display: {
        default:
          'posted in subreddit <a href="https://reddit.com/r/{channel}" target="_blank">r/{channel}</a>',
        short: 'posted in subreddit',
        channel: '<a href="https://reddit.com/r/{channel}" target="_blank">r/{channel}</a>',
      },
      isContribution: RedditGrid.post.isContribution,
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
      isContribution: SlackGrid.join.isContribution,
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
      isContribution: SlackGrid.message.isContribution,
    },
  },
  [PlatformType.TWITTER]: {
    [TwitterActivityType.HASHTAG]: {
      display: {
        default: 'posted a tweet',
        short: 'posted a tweet',
        channel: '',
      },
      isContribution: TwitterGrid.hashtag.isContribution,
    },
    [TwitterActivityType.FOLLOW]: {
      display: {
        default: 'followed you',
        short: 'followed you',
        channel: '',
      },
      isContribution: TwitterGrid.follow.isContribution,
    },
    [TwitterActivityType.MENTION]: {
      display: {
        default: 'mentioned you in a tweet',
        short: 'mentioned you',
        channel: '',
      },
      isContribution: TwitterGrid.mention.isContribution,
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
      isContribution: StackOverflowGrid.question.isContribution,
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
      isContribution: StackOverflowGrid.answer.isContribution,
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
      isContribution: DiscourseGrid.create_topic.isContribution,
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
      isContribution: DiscourseGrid.message_in_topic.isContribution,
    },
    [DiscourseActivityType.JOIN]: {
      display: {
        default: 'Joined a forum',
        short: 'joined a forum',
        channel: '',
      },
      isContribution: DiscourseGrid.join.isContribution,
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
      isContribution: DiscourseGrid.like.isContribution,
    },
  },
}
