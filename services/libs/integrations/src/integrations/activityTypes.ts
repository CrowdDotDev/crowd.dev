import { isUrl } from '@crowd/common'
import { ActivityTypeDisplayProperties, DefaultActivityTypes, PlatformType } from '@crowd/types'

import { ConfluenceActivityType } from './confluence/types'
import { DEVTO_GRID } from './devto/grid'
import { DevToActivityType } from './devto/types'
import { DISCORD_GRID } from './discord/grid'
import { DiscordActivityType } from './discord/types'
import { DISCOURSE_GRID } from './discourse/grid'
import { DiscourseActivityType } from './discourse/types'
import { GerritActivityType } from './gerrit/types'
import { GitActivityType } from './git/types'
import { GITHUB_GRID } from './github/grid'
import { GithubActivityType } from './github/types'
import { GITLAB_GRID } from './gitlab/grid'
import { GitlabActivityType } from './gitlab/types'
import { Groupsio_GRID } from './groupsio/grid'
import { GroupsioActivityType } from './groupsio/types'
import { HACKERNEWS_GRID } from './hackernews/grid'
import { HackerNewsActivityType } from './hackernews/types'
import { JiraActivityType } from './jira/types'
import { LINKEDIN_GRID } from './premium/linkedin/grid'
import { LinkedinActivityType } from './premium/linkedin/types'
import { REDDIT_GRID } from './reddit/grid'
import { RedditActivityType } from './reddit/types'
import { SLACK_GRID } from './slack/grid'
import { SlackActivityType } from './slack/types'
import { STACKOVERFLOW_GRID } from './stackoverflow/grid'
import { StackOverflowActivityType } from './stackoverflow/types'
import { TWITTER_GRID } from './twitter/grid'
import { TwitterActivityType } from './twitter/types'

export const UNKNOWN_ACTIVITY_TYPE_DISPLAY: ActivityTypeDisplayProperties = {
  default: 'Conducted an activity',
  short: 'conducted an activity',
  author: 'conducted by',
  channel: '',
}

const githubUrl = 'https://github.com'
const gitlabUrl = 'https://gitlab.com'

const defaultGithubChannelFormatter = (channel) => {
  const channelSplit = channel.split('/')
  const organization = channelSplit[3]
  const repo = channelSplit[4]
  return `<a href="${githubUrl}/${organization}/${repo}" target="_blank">/${repo}</a>`
}

const defaultGitlabChannelFormatter = (channel) => {
  const channelSplit = channel.split('/')
  const organization = channelSplit[3]
  const repo = channelSplit[4]
  return `<a href="${gitlabUrl}/${organization}/${repo}" target="_blank">/${repo}</a>`
}

const defaultGitChannelFormatter = (channel) => {
  // Helper function to create links
  const createLink = (href, text) => `<a href="${href}" target="_blank">${text}</a>`

  // Extract domain and path from the channel URL
  const url = new URL(channel)
  const domain = url.hostname
  const path = url.pathname.replace(/^\//, '').replace(/\.git$/, '')

  // special case, this is gerrit
  if (domain.startsWith('git.opendaylight')) {
    let repoName = path.split('/').pop()
    // remove .git from repoName from the end if its there
    repoName = repoName.replace(/\.git$/, '')

    const gitwebUrl = `https://${domain}/gerrit/gitweb?p=${repoName}.git`
    return createLink(gitwebUrl, `/${repoName}`)
  }

  // Git Like
  if (domain.startsWith('git.')) {
    return createLink(channel, `/${path}`)
  }

  // Gerrit like
  if (domain.startsWith('gerrit.')) {
    let repoName = path.split('/').pop()
    // remove .git from repoName from the end if its there
    repoName = repoName.replace(/\.git$/, '')
    const gitwebUrl = `https://${domain}/r/gitweb?p=${repoName}.git`
    return createLink(gitwebUrl, `/${repoName}`)
  }

  // GitHub
  if (domain === 'github.com') {
    let repoName = path.split('/').pop()
    // remove .git from repoName from the end if its there
    repoName = repoName.replace(/\.git$/, '')
    return createLink(channel, `/${repoName}`)
  }

  // Default case: just return the channel as a link
  return createLink(channel, channel)
}

const defaultConfluenceChannelFormatter = (channel) => {
  return `<a href="${channel}" target="_blank">${channel}</a>`
}

const defaultGerritChannelFormatter = (channel) => {
  return `<a href="${channel}" target="_blank">${channel}</a>`
}

const defaultJiraChannelFormatter = (channel) => {
  return `<a href="${channel}" target="_blank">${channel}</a>`
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
      calculateSentiment: true,
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
      calculateSentiment: true,
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
      calculateSentiment: false,
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
      calculateSentiment: false,
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
      calculateSentiment: true,
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
      calculateSentiment: true,
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
      calculateSentiment: false,
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
      calculateSentiment: false,
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
      calculateSentiment: true,
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
      calculateSentiment: false,
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
      calculateSentiment: false,
    },
    [GithubActivityType.PULL_REQUEST_MERGED]: {
      display: {
        default: 'merged pull request {self}',
        short: 'merged a pull request',
        channel: '{channel}',
        formatter: {
          channel: defaultGithubChannelFormatter,
          self: (activity) => {
            const prNumberAndTitle = `#${activity.url.split('/')[6]} ${activity.parent?.title}`
            return `<a href="${activity.url}" target="_blank">${prNumberAndTitle}</a>`
          },
        },
      },
      isContribution: GITHUB_GRID[GithubActivityType.PULL_REQUEST_MERGED].isContribution,
      calculateSentiment: false,
    },
    [GithubActivityType.PULL_REQUEST_ASSIGNED]: {
      display: {
        default: 'assigned pull request {self}',
        short: 'assigned a pull request',
        channel: '{channel}',
        formatter: {
          channel: defaultGithubChannelFormatter,
          self: (activity) => {
            const prNumberAndTitle = `#${activity.url.split('/')[6]} ${activity.parent?.title}`
            return `<a href="${activity.url}" style="max-width:150px" target="_blank">${prNumberAndTitle}</a> to <a href="/members/${activity.objectMemberId}" target="_blank">${activity.objectMember.displayName}</a>`
          },
        },
      },
      isContribution: GITHUB_GRID[GithubActivityType.PULL_REQUEST_ASSIGNED].isContribution,
      calculateSentiment: false,
    },
    [GithubActivityType.PULL_REQUEST_REVIEWED]: {
      display: {
        default: 'reviewed pull request {self}',
        short: 'reviewed a pull request',
        channel: '{channel}',
        formatter: {
          channel: defaultGithubChannelFormatter,
          self: (activity) => {
            const prNumberAndTitle = `#${activity.url.split('/')[6]} ${activity.parent?.title}`
            return `<a href="${activity.url}" target="_blank">${prNumberAndTitle}</a>`
          },
        },
      },
      isContribution: GITHUB_GRID[GithubActivityType.PULL_REQUEST_REVIEWED].isContribution,
      calculateSentiment: true,
    },
    [GithubActivityType.PULL_REQUEST_REVIEW_REQUESTED]: {
      display: {
        default: 'requested a review for pull request {self}',
        short: 'requested a pull request review',
        channel: '{channel}',
        formatter: {
          channel: defaultGithubChannelFormatter,
          self: (activity) => {
            const prNumberAndTitle = `#${activity.url.split('/')[6]} ${activity.parent?.title}`
            return `<a href="${activity.url}" style="max-width:150px" target="_blank">${prNumberAndTitle}</a> from <a href="/members/${activity.objectMemberId}" target="_blank">${activity.objectMember.displayName}</a>`
          },
        },
      },
      isContribution: GITHUB_GRID[GithubActivityType.PULL_REQUEST_REVIEW_REQUESTED].isContribution,
      calculateSentiment: false,
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
              activity.parent?.title
            }`
            return `<a href="${activity.url}" style="max-width:150px" target="_blank">${prNumberAndTitle}</a>`
          },
        },
      },
      isContribution:
        GITHUB_GRID[GithubActivityType.PULL_REQUEST_REVIEW_THREAD_COMMENT].isContribution,
      calculateSentiment: true,
    },
    [GitActivityType.AUTHORED_COMMIT]: {
      display: {
        default: 'authored a commit in {channel}',
        short: 'authored a commit',
        author: 'authored by',
        channel: '{channel}',
        formatter: {
          channel: defaultGithubChannelFormatter,
        },
      },
      isContribution: true,
      calculateSentiment: false,
    },
    [GitActivityType.REVIEWED_COMMIT]: {
      display: {
        default: 'reviewed a commit in {channel}',
        short: 'reviewed a commit',
        author: 'reviewed by',
        channel: '{channel}',
        formatter: {
          channel: defaultGithubChannelFormatter,
        },
      },
      isContribution: true,
      calculateSentiment: false,
    },
    [GitActivityType.TESTED_COMMIT]: {
      display: {
        default: 'tested a commit in {channel}',
        short: 'tested a commit',
        author: 'tested by',
        channel: '{channel}',
        formatter: {
          channel: defaultGithubChannelFormatter,
        },
      },
      isContribution: true,
      calculateSentiment: false,
    },
    [GitActivityType.CO_AUTHORED_COMMIT]: {
      display: {
        default: 'co-authored a commit in {channel}',
        short: 'co-authored a commit',
        author: 'co-authored by',
        channel: '{channel}',
        formatter: {
          channel: defaultGithubChannelFormatter,
        },
      },
      isContribution: true,
      calculateSentiment: false,
    },
    [GitActivityType.INFORMED_COMMIT]: {
      display: {
        default: 'informed a commit in {channel}',
        short: 'informed a commit',
        author: 'informed by',
        channel: '{channel}',
        formatter: {
          channel: defaultGithubChannelFormatter,
        },
      },
      isContribution: true,
      calculateSentiment: false,
    },
    [GitActivityType.INFLUENCED_COMMIT]: {
      display: {
        default: 'influenced a commit in {channel}',
        short: 'influenced a commit',
        author: 'influenced by',
        channel: '{channel}',
        formatter: {
          channel: defaultGithubChannelFormatter,
        },
      },
      isContribution: true,
      calculateSentiment: false,
    },
    [GitActivityType.APPROVED_COMMIT]: {
      display: {
        default: 'approved a commit in {channel}',
        short: 'approved a commit',
        author: 'approved by',
        channel: '{channel}',
        formatter: {
          channel: defaultGithubChannelFormatter,
        },
      },
      isContribution: true,
      calculateSentiment: false,
    },
    [GitActivityType.COMMITTED_COMMIT]: {
      display: {
        default: 'committed in {channel}',
        short: 'committed',
        author: 'committed by',
        channel: '{channel}',
        formatter: {
          channel: defaultGithubChannelFormatter,
        },
      },
      isContribution: true,
      calculateSentiment: false,
    },
    [GitActivityType.REPORTED_COMMIT]: {
      display: {
        default: 'reported a commit in {channel}',
        short: 'reported a commit',
        author: 'reported by',
        channel: '{channel}',
        formatter: {
          channel: defaultGithubChannelFormatter,
        },
      },
      isContribution: true,
      calculateSentiment: false,
    },
    [GitActivityType.RESOLVED_COMMIT]: {
      display: {
        default: 'resolved a commit in {channel}',
        short: 'resolved a commit',
        author: 'resolved by',
        channel: '{channel}',
        formatter: {
          channel: defaultGithubChannelFormatter,
        },
      },
      isContribution: true,
      calculateSentiment: false,
    },
    [GitActivityType.SIGNED_OFF_COMMIT]: {
      display: {
        default: 'signed off a commit in {channel}',
        short: 'signed off a commit',
        author: 'signed off by',
        channel: '{channel}',
        formatter: {
          channel: defaultGithubChannelFormatter,
        },
      },
      isContribution: true,
      calculateSentiment: false,
    },
  },
  [PlatformType.GIT]: {
    [GitActivityType.AUTHORED_COMMIT]: {
      display: {
        default: 'authored a commit in {channel}',
        short: 'authored a commit',
        author: 'authored by',
        channel: '{channel}',
        formatter: {
          channel: defaultGitChannelFormatter,
        },
      },
      isContribution: true,
      calculateSentiment: false,
    },
    [GitActivityType.REVIEWED_COMMIT]: {
      display: {
        default: 'reviewed a commit in {channel}',
        short: 'reviewed a commit',
        author: 'reviewed by',
        channel: '{channel}',
        formatter: {
          channel: defaultGitChannelFormatter,
        },
      },
      isContribution: true,
      calculateSentiment: false,
    },
    [GitActivityType.TESTED_COMMIT]: {
      display: {
        default: 'tested a commit in {channel}',
        short: 'tested a commit',
        author: 'tested by',
        channel: '{channel}',
        formatter: {
          channel: defaultGitChannelFormatter,
        },
      },
      isContribution: true,
      calculateSentiment: false,
    },
    [GitActivityType.CO_AUTHORED_COMMIT]: {
      display: {
        default: 'co-authored a commit in {channel}',
        short: 'co-authored a commit',
        author: 'co-authored by',
        channel: '{channel}',
        formatter: {
          channel: defaultGitChannelFormatter,
        },
      },
      isContribution: true,
      calculateSentiment: false,
    },
    [GitActivityType.INFORMED_COMMIT]: {
      display: {
        default: 'informed a commit in {channel}',
        short: 'informed a commit',
        author: 'informed by',
        channel: '{channel}',
        formatter: {
          channel: defaultGitChannelFormatter,
        },
      },
      isContribution: true,
      calculateSentiment: false,
    },
    [GitActivityType.INFLUENCED_COMMIT]: {
      display: {
        default: 'influenced a commit in {channel}',
        short: 'influenced a commit',
        author: 'influenced by',
        channel: '{channel}',
        formatter: {
          channel: defaultGitChannelFormatter,
        },
      },
      isContribution: true,
      calculateSentiment: false,
    },
    [GitActivityType.APPROVED_COMMIT]: {
      display: {
        default: 'approved a commit in {channel}',
        short: 'approved a commit',
        author: 'approved by',
        channel: '{channel}',
        formatter: {
          channel: defaultGitChannelFormatter,
        },
      },
      isContribution: true,
      calculateSentiment: false,
    },
    [GitActivityType.COMMITTED_COMMIT]: {
      display: {
        default: 'committed a commit in {channel}',
        short: 'committed a commit',
        author: 'committed by',
        channel: '{channel}',
        formatter: {
          channel: defaultGitChannelFormatter,
        },
      },
      isContribution: true,
      calculateSentiment: false,
    },
    [GitActivityType.REPORTED_COMMIT]: {
      display: {
        default: 'reported a commit in {channel}',
        short: 'reported a commit',
        author: 'reported by',
        channel: '{channel}',
        formatter: {
          channel: defaultGitChannelFormatter,
        },
      },
      isContribution: true,
      calculateSentiment: false,
    },
    [GitActivityType.RESOLVED_COMMIT]: {
      display: {
        default: 'resolved a commit in {channel}',
        short: 'resolved a commit',
        author: 'resolved by',
        channel: '{channel}',
        formatter: {
          channel: defaultGitChannelFormatter,
        },
      },
      isContribution: true,
      calculateSentiment: false,
    },
    [GitActivityType.SIGNED_OFF_COMMIT]: {
      display: {
        default: 'signed off a commit in {channel}',
        short: 'signed off a commit',
        author: 'signed off by',
        channel: '{channel}',
        formatter: {
          channel: defaultGitChannelFormatter,
        },
      },
      isContribution: true,
      calculateSentiment: false,
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
      calculateSentiment: true,
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
      calculateSentiment: false,
    },
    [DiscordActivityType.MESSAGE]: {
      display: {
        default:
          'sent a message in <span class="text-brand-500 truncate max-w-2xs">#{channel}</span>',
        short: 'sent a message',
        channel: '<span class="text-brand-500 truncate max-w-2xs">#{channel}</span>',
      },
      isContribution: DISCORD_GRID[DiscordActivityType.MESSAGE].isContribution,
      calculateSentiment: true,
    },
    [DiscordActivityType.THREAD_STARTED]: {
      display: {
        default: 'started a new thread',
        short: 'started a new thread',
        channel: '',
      },
      isContribution: DISCORD_GRID[DiscordActivityType.THREAD_STARTED].isContribution,
      calculateSentiment: true,
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
      calculateSentiment: true,
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
      calculateSentiment: true,
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
      calculateSentiment: true,
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
      calculateSentiment: true,
    },
    [LinkedinActivityType.REACTION]: {
      display: {
        default:
          'reacted with <img src="/images/integrations/linkedin-reactions/{attributes.reactionType}.svg"> on a post <a href="{attributes.postUrl}" target="_blank">{attributes.postBody}</a>',
        short: 'reacted',
        channel: '<a href="{attributes.postUrl}" target="_blank">{attributes.postBody}</a>',
      },
      isContribution: LINKEDIN_GRID[LinkedinActivityType.REACTION].isContribution,
      calculateSentiment: true,
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
      calculateSentiment: true,
    },
    [RedditActivityType.POST]: {
      display: {
        default:
          'posted in subreddit <a href="https://reddit.com/r/{channel}" target="_blank">r/{channel}</a>',
        short: 'posted in subreddit',
        channel: '<a href="https://reddit.com/r/{channel}" target="_blank">r/{channel}</a>',
      },
      isContribution: REDDIT_GRID[RedditActivityType.POST].isContribution,
      calculateSentiment: true,
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
      calculateSentiment: false,
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
      calculateSentiment: true,
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
      calculateSentiment: true,
    },
    [TwitterActivityType.FOLLOW]: {
      display: {
        default: 'followed you',
        short: 'followed you',
        channel: '',
      },
      isContribution: TWITTER_GRID[TwitterActivityType.FOLLOW].isContribution,
      calculateSentiment: false,
    },
    [TwitterActivityType.MENTION]: {
      display: {
        default: 'mentioned you in a tweet',
        short: 'mentioned you',
        channel: '',
      },
      isContribution: TWITTER_GRID[TwitterActivityType.MENTION].isContribution,
      calculateSentiment: true,
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
      calculateSentiment: true,
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
      calculateSentiment: true,
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
      calculateSentiment: true,
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
      calculateSentiment: true,
    },
    [DiscourseActivityType.JOIN]: {
      display: {
        default: 'Joined a forum',
        short: 'joined a forum',
        channel: '',
      },
      isContribution: DISCOURSE_GRID[DiscourseActivityType.JOIN].isContribution,
      calculateSentiment: true,
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
      calculateSentiment: true,
    },
  },
  [PlatformType.GROUPSIO]: {
    [GroupsioActivityType.MEMBER_JOIN]: {
      display: {
        default: 'Joined {channel}',
        short: 'joined',
        channel: '{channel}',
      },
      isContribution: Groupsio_GRID[GroupsioActivityType.MEMBER_JOIN].isContribution,
      calculateSentiment: false,
    },
    [GroupsioActivityType.MESSAGE]: {
      display: {
        default: 'Sent a message in {channel}',
        short: 'sent a message',
        channel: '{channel}',
      },
      isContribution: Groupsio_GRID[GroupsioActivityType.MESSAGE].isContribution,
      calculateSentiment: true,
    },
    [GroupsioActivityType.MEMBER_LEAVE]: {
      display: {
        default: 'Left {channel}',
        short: 'left',
        channel: '{channel}',
      },
      isContribution: Groupsio_GRID[GroupsioActivityType.MEMBER_LEAVE].isContribution,
      calculateSentiment: false,
    },
  },
  [PlatformType.CONFLUENCE]: {
    [ConfluenceActivityType.PAGE_CREATED]: {
      display: {
        default: 'created a confluence page in {channel}',
        short: 'created a page',
        channel: '{channel}',
        formatter: {
          channel: defaultConfluenceChannelFormatter,
          self: (activity) => {
            const prNumberAndTitle = `#${activity.url.split('/')[6]} ${activity.parent?.title}`
            return `<a href="${activity.url}" target="_blank">${prNumberAndTitle}</a>`
          },
        },
      },
      isContribution: true,
      calculateSentiment: true,
    },
    [ConfluenceActivityType.PAGE_UPDATED]: {
      display: {
        default: 'updated a confluence page in {channel}',
        short: 'updated a page',
        channel: '{channel}',
        formatter: {
          channel: defaultConfluenceChannelFormatter,
          self: (activity) => {
            const prNumberAndTitle = `#${activity.url.split('/')[6]} ${activity.parent?.title}`
            return `<a href="${activity.url}" target="_blank">${prNumberAndTitle}</a>`
          },
        },
      },
      isContribution: true,
      calculateSentiment: true,
    },
    [ConfluenceActivityType.BLOGPOST_CREATED]: {
      display: {
        default: 'created a confluence blogpost in {channel}',
        short: 'created a page',
        channel: '{channel}',
        formatter: {
          channel: defaultConfluenceChannelFormatter,
          self: (activity) => {
            const prNumberAndTitle = `#${activity.url.split('/')[6]} ${activity.parent?.title}`
            return `<a href="${activity.url}" target="_blank">${prNumberAndTitle}</a>`
          },
        },
      },
      isContribution: true,
      calculateSentiment: true,
    },
    [ConfluenceActivityType.BLOGPOST_UPDATED]: {
      display: {
        default: 'updated a confluence blogpost in {channel}',
        short: 'updated a page',
        channel: '{channel}',
        formatter: {
          channel: defaultConfluenceChannelFormatter,
          self: (activity) => {
            const prNumberAndTitle = `#${activity.url.split('/')[6]} ${activity.parent?.title}`
            return `<a href="${activity.url}" target="_blank">${prNumberAndTitle}</a>`
          },
        },
      },
      isContribution: true,
      calculateSentiment: true,
    },
    [ConfluenceActivityType.COMMENT_CREATED]: {
      display: {
        default: 'added a comment to a confluence page in {channel}',
        short: 'added a comment',
        channel: '{channel}',
        formatter: {
          channel: defaultConfluenceChannelFormatter,
          self: (activity) => {
            const prNumberAndTitle = `#${activity.url.split('/')[6]} ${activity.parent?.title}`
            return `<a href="${activity.url}" target="_blank">${prNumberAndTitle}</a>`
          },
        },
      },
      isContribution: false,
      calculateSentiment: true,
    },
    [ConfluenceActivityType.ATTACHMENT_CREATED]: {
      display: {
        default: 'added an attachment to a confluence page in {channel}',
        short: 'added an attachment',
        channel: '{channel}',
        formatter: {
          channel: defaultConfluenceChannelFormatter,
          self: (activity) => {
            const prNumberAndTitle = `#${activity.url.split('/')[6]} ${activity.parent?.title}`
            return `<a href="${activity.url}" target="_blank">${prNumberAndTitle}</a>`
          },
        },
      },
      isContribution: true,
      calculateSentiment: false,
    },
  },
  [PlatformType.GERRIT]: {
    [GerritActivityType.CHANGESET_CREATED]: {
      display: {
        default: 'Created a gerrit changeset in {channel}',
        short: 'created a changeset',
        channel: '{channel}',
        formatter: {
          channel: defaultGerritChannelFormatter,
          self: (activity) => {
            const prNumberAndTitle = `#${activity.url.split('/')[6]} ${activity.parent?.title}`
            return `<a href="${activity.url}" target="_blank">${prNumberAndTitle}</a>`
          },
        },
      },
      isContribution: true,
      calculateSentiment: false,
    },
    [GerritActivityType.CHANGESET_MERGED]: {
      display: {
        default: 'Merged a gerrit changeset in {channel}',
        short: 'merged a changeset',
        channel: '{channel}',
        formatter: {
          channel: defaultGerritChannelFormatter,
          self: (activity) => {
            const prNumberAndTitle = `#${activity.url.split('/')[6]} ${activity.parent?.title}`
            return `<a href="${activity.url}" target="_blank">${prNumberAndTitle}</a>`
          },
        },
      },
      isContribution: true,
      calculateSentiment: false,
    },
    [GerritActivityType.CHANGESET_CLOSED]: {
      display: {
        default: 'Closed a gerrit changeset in {channel}',
        short: 'closed a changeset',
        channel: '{channel}',
        formatter: {
          channel: defaultGerritChannelFormatter,
          self: (activity) => {
            const prNumberAndTitle = `#${activity.url.split('/')[6]} ${activity.parent?.title}`
            return `<a href="${activity.url}" target="_blank">${prNumberAndTitle}</a>`
          },
        },
      },
      isContribution: true,
      calculateSentiment: false,
    },
    [GerritActivityType.CHANGESET_ABANDONED]: {
      display: {
        default: 'Abandoned a gerrit changeset in {channel}',
        short: 'abandoned a changeset',
        channel: '{channel}',
        formatter: {
          channel: defaultGerritChannelFormatter,
          self: (activity) => {
            const prNumberAndTitle = `#${activity.url.split('/')[6]} ${activity.parent?.title}`
            return `<a href="${activity.url}" target="_blank">${prNumberAndTitle}</a>`
          },
        },
      },
      isContribution: true,
      calculateSentiment: false,
    },
    [GerritActivityType.CHANGESET_COMMENT_CREATED]: {
      display: {
        default: 'added a comment to gerrit changeset in {channel}',
        short: 'added a comment to changeset',
        channel: '{channel}',
        formatter: {
          channel: defaultGerritChannelFormatter,
          self: (activity) => {
            const prNumberAndTitle = `#${activity.url.split('/')[6]} ${activity.parent?.title}`
            return `<a href="${activity.url}" target="_blank">${prNumberAndTitle}</a>`
          },
        },
      },
      isContribution: true,
      calculateSentiment: true,
    },
    [GerritActivityType.PATCHSET_CREATED]: {
      display: {
        default: 'created a gerrit patchset in {channel}',
        short: 'created a patchset',
        channel: '{channel}',
        formatter: {
          channel: defaultGerritChannelFormatter,
          self: (activity) => {
            const prNumberAndTitle = `#${activity.url.split('/')[6]} ${activity.parent?.title}`
            return `<a href="${activity.url}" target="_blank">${prNumberAndTitle}</a>`
          },
        },
      },
      isContribution: true,
      calculateSentiment: false,
    },
    [GerritActivityType.PATCHSET_COMMENT_CREATED]: {
      display: {
        default: 'added a comment to a gerrit patchset in {channel}',
        short: 'added a patchset comment',
        channel: '{channel}',
        formatter: {
          channel: defaultGerritChannelFormatter,
          self: (activity) => {
            const prNumberAndTitle = `#${activity.url.split('/')[6]} ${activity.parent?.title}`
            return `<a href="${activity.url}" target="_blank">${prNumberAndTitle}</a>`
          },
        },
      },
      isContribution: true,
      calculateSentiment: true,
    },
    [GerritActivityType.PATCHSET_APPROVAL_CREATED]: {
      display: {
        default: 'created a gerrit patchset approval in {channel}',
        short: 'created a patchset approval',
        channel: '{channel}',
        formatter: {
          channel: defaultGerritChannelFormatter,
          self: (activity) => {
            const prNumberAndTitle = `#${activity.url.split('/')[6]} ${activity.parent?.title}`
            return `<a href="${activity.url}" target="_blank">${prNumberAndTitle}</a>`
          },
        },
      },
      isContribution: true,
      calculateSentiment: false,
    },
  },
  [PlatformType.JIRA]: {
    [JiraActivityType.ISSUE_CREATED]: {
      display: {
        default: 'created a jira issue in {channel}',
        short: 'created an issue',
        channel: '{channel}',
        formatter: {
          channel: defaultJiraChannelFormatter,
          self: (activity) => {
            const prNumberAndTitle = `#${activity.url.split('/')[6]} ${activity.parent?.title}`
            return `<a href="${activity.url}" target="_blank">${prNumberAndTitle}</a>`
          },
        },
      },
      isContribution: true,
      calculateSentiment: true,
    },
    [JiraActivityType.ISSUE_CLOSED]: {
      display: {
        default: 'closed a jira issue in {channel}',
        short: 'closed an issue',
        channel: '{channel}',
        formatter: {
          channel: defaultJiraChannelFormatter,
          self: (activity) => {
            const prNumberAndTitle = `#${activity.url.split('/')[6]} ${activity.parent?.title}`
            return `<a href="${activity.url}" target="_blank">${prNumberAndTitle}</a>`
          },
        },
      },
      isContribution: true,
      calculateSentiment: false,
    },
    [JiraActivityType.ISSUE_UPDATED]: {
      display: {
        default: 'a jira issue was updated in {channel}',
        short: 'updated an issue',
        channel: '{channel}',
        formatter: {
          channel: defaultJiraChannelFormatter,
          self: (activity) => {
            const prNumberAndTitle = `#${activity.url.split('/')[6]} ${activity.parent?.title}`
            return `<a href="${activity.url}" target="_blank">${prNumberAndTitle}</a>`
          },
        },
      },
      isContribution: true,
      calculateSentiment: true,
    },
    [JiraActivityType.ISSUE_ASSIGNED]: {
      display: {
        default: 'a jira issue was assigned in {channel}',
        short: 'assigned an issue',
        channel: '{channel}',
        formatter: {
          channel: defaultJiraChannelFormatter,
          self: (activity) => {
            const prNumberAndTitle = `#${activity.url.split('/')[6]} ${activity.parent?.title}`
            return `<a href="${activity.url}" target="_blank">${prNumberAndTitle}</a>`
          },
        },
      },
      isContribution: true,
      calculateSentiment: true,
    },
    [JiraActivityType.ISSUE_COMMENT_CREATED]: {
      display: {
        default: 'created a comment on a jira issue in {channel}',
        short: 'created a comment on an issue',
        channel: '{channel}',
        formatter: {
          channel: defaultJiraChannelFormatter,
          self: (activity) => {
            const prNumberAndTitle = `#${activity.url.split('/')[6]} ${activity.parent?.title}`
            return `<a href="${activity.url}" target="_blank">${prNumberAndTitle}</a>`
          },
        },
      },
      isContribution: true,
      calculateSentiment: true,
    },
    [JiraActivityType.ISSUE_COMMENT_UPDATED]: {
      display: {
        default: 'updated a comment on a jira issue in {channel}',
        short: 'updated a comment on an issue',
        channel: '{channel}',
        formatter: {
          channel: defaultJiraChannelFormatter,
          self: (activity) => {
            const prNumberAndTitle = `#${activity.url.split('/')[6]} ${activity.parent?.title}`
            return `<a href="${activity.url}" target="_blank">${prNumberAndTitle}</a>`
          },
        },
      },
      isContribution: true,
      calculateSentiment: true,
    },
    [JiraActivityType.ISSUE_ATTACHMENT_ADDED]: {
      display: {
        default: 'added an attachment on a jira issue in {channel}',
        short: 'added an attachment on an issue',
        channel: '{channel}',
        formatter: {
          channel: defaultJiraChannelFormatter,
          self: (activity) => {
            const prNumberAndTitle = `#${activity.url.split('/')[6]} ${activity.parent?.title}`
            return `<a href="${activity.url}" target="_blank">${prNumberAndTitle}</a>`
          },
        },
      },
      isContribution: true,
      calculateSentiment: false,
    },
  },
  [PlatformType.GITLAB]: {
    [GitlabActivityType.FORK]: {
      display: {
        default: 'forked {channel}',
        short: 'forked',
        channel: '{channel}',
        formatter: {
          channel: defaultGitlabChannelFormatter,
        },
      },
      isContribution: GITLAB_GRID.fork.isContribution,
      calculateSentiment: false,
    },
    [GitlabActivityType.ISSUE_CLOSED]: {
      display: {
        default: 'closed an issue in {channel}',
        short: 'closed an issue',
        channel: '{channel}',
        formatter: {
          channel: defaultGitlabChannelFormatter,
        },
      },
      isContribution: GITLAB_GRID[GitlabActivityType.ISSUE_CLOSED].isContribution,
      calculateSentiment: false,
    },
    [GitlabActivityType.ISSUE_OPENED]: {
      display: {
        default: 'opened a new issue in {channel}',
        short: 'opened an issue',
        channel: '{channel}',
        formatter: {
          channel: defaultGitlabChannelFormatter,
        },
      },
      isContribution: GITLAB_GRID[GitlabActivityType.ISSUE_OPENED].isContribution,
      calculateSentiment: true,
    },
    [GitlabActivityType.ISSUE_COMMENT]: {
      display: {
        default: 'commented on an issue in {channel}',
        short: 'commented on an issue',
        channel: '{channel}',
        formatter: {
          channel: defaultGitlabChannelFormatter,
        },
      },
      isContribution: GITLAB_GRID[GitlabActivityType.ISSUE_COMMENT].isContribution,
      calculateSentiment: true,
    },
    [GitlabActivityType.MERGE_REQUEST_CLOSED]: {
      display: {
        default: 'closed a merge request in {channel}',
        short: 'closed a merge request',
        channel: '{channel}',
        formatter: {
          channel: defaultGitlabChannelFormatter,
        },
      },
      isContribution: GITLAB_GRID[GitlabActivityType.MERGE_REQUEST_CLOSED].isContribution,
      calculateSentiment: false,
    },
    [GitlabActivityType.MERGE_REQUEST_OPENED]: {
      display: {
        default: 'opened a merge request in {channel}',
        short: 'opened a merge request',
        channel: '{channel}',
        formatter: {
          channel: defaultGitlabChannelFormatter,
        },
      },
      isContribution: GITLAB_GRID[GitlabActivityType.MERGE_REQUEST_OPENED].isContribution,
      calculateSentiment: true,
    },
    [GitlabActivityType.MERGE_REQUEST_COMMENT]: {
      display: {
        default: 'commented on a merge request in {channel}',
        short: 'commented on a merge request',
        channel: '{channel}',
        formatter: {
          channel: defaultGitlabChannelFormatter,
        },
      },
      isContribution: GITLAB_GRID[GitlabActivityType.MERGE_REQUEST_COMMENT].isContribution,
      calculateSentiment: true,
    },
    [GitlabActivityType.STAR]: {
      display: {
        default: 'starred {channel}',
        short: 'starred',
        channel: '{channel}',
        formatter: {
          channel: defaultGitlabChannelFormatter,
        },
      },
      isContribution: GITLAB_GRID[GitlabActivityType.STAR].isContribution,
      calculateSentiment: false,
    },
    [GitlabActivityType.MERGE_REQUEST_MERGED]: {
      display: {
        default: 'merged merge request {self}',
        short: 'merged a merge request',
        channel: '{channel}',
        formatter: {
          channel: defaultGitlabChannelFormatter,
          self: (activity) => {
            const prNumberAndTitle = `#${activity.sourceParentId} ${activity.parent?.title}`
            return `<a href="${activity.parent.url}" target="_blank">${prNumberAndTitle}</a>`
          },
        },
      },
      isContribution: GITLAB_GRID[GitlabActivityType.MERGE_REQUEST_MERGED].isContribution,
      calculateSentiment: false,
    },
    [GitlabActivityType.MERGE_REQUEST_ASSIGNED]: {
      display: {
        default: 'assigned merge request {self}',
        short: 'assigned a merge request',
        channel: '{channel}',
        formatter: {
          channel: defaultGitlabChannelFormatter,
          self: (activity) => {
            const prNumberAndTitle = `#${activity.sourceParentId} ${activity.parent?.title}`
            return `<a href="${activity.parent.url}" style="max-width:150px" target="_blank">${prNumberAndTitle}</a> to <a href="/members/${activity.objectMemberId}" target="_blank">${activity.objectMember.displayName}</a>`
          },
        },
      },
      isContribution: GITLAB_GRID[GitlabActivityType.MERGE_REQUEST_ASSIGNED].isContribution,
      calculateSentiment: false,
    },
    [GitlabActivityType.MERGE_REQUEST_REVIEW_APPROVED]: {
      display: {
        default: 'approved a merge request {self}',
        short: 'approved a merge request',
        channel: '{channel}',
        formatter: {
          channel: defaultGitlabChannelFormatter,
          self: (activity) => {
            const prNumberAndTitle = `#${activity.sourceParentId} ${activity.parent?.title}`
            return `<a href="${activity.parent.url}" style="max-width:150px" target="_blank">${prNumberAndTitle}</a>`
          },
        },
      },
      isContribution: GITLAB_GRID[GitlabActivityType.MERGE_REQUEST_REVIEW_APPROVED].isContribution,
      calculateSentiment: false,
    },
    [GitlabActivityType.MERGE_REQUEST_REVIEW_CHANGES_REQUESTED]: {
      display: {
        default: 'requested changes for a merge request {self}',
        short: 'requested changes for a merge request',
        channel: '{channel}',
        formatter: {
          channel: defaultGitlabChannelFormatter,
          self: (activity) => {
            const prNumberAndTitle = `#${activity.sourceParentId} ${activity.parent?.title}`
            return `<a href="${activity.parent.url}" style="max-width:150px" target="_blank">${prNumberAndTitle}</a>`
          },
        },
      },
      isContribution:
        GITLAB_GRID[GitlabActivityType.MERGE_REQUEST_REVIEW_CHANGES_REQUESTED].isContribution,
      calculateSentiment: false,
    },
    [GitlabActivityType.MERGE_REQUEST_REVIEW_REQUESTED]: {
      display: {
        default: 'requested a review for merge request {self}',
        short: 'requested a merge request review',
        channel: '{channel}',
        formatter: {
          channel: defaultGitlabChannelFormatter,
          self: (activity) => {
            const prNumberAndTitle = `#${activity.sourceParentId} ${activity.parent?.title}`
            return `<a href="${activity.parent.url}" style="max-width:150px" target="_blank">${prNumberAndTitle}</a> from <a href="/members/${activity.objectMemberId}" target="_blank">${activity.objectMember.displayName}</a>`
          },
        },
      },
      isContribution: GITLAB_GRID[GitlabActivityType.MERGE_REQUEST_REVIEW_REQUESTED].isContribution,
      calculateSentiment: false,
    },
    [GitActivityType.AUTHORED_COMMIT]: {
      display: {
        default: 'authored a commit in {channel}',
        short: 'authored a commit',
        author: 'authored by',
        channel: '{channel}',
        formatter: {
          channel: defaultGitlabChannelFormatter,
        },
      },
      isContribution: true,
      calculateSentiment: false,
    },
    [GitActivityType.REVIEWED_COMMIT]: {
      display: {
        default: 'reviewed a commit in {channel}',
        short: 'reviewed a commit',
        author: 'reviewed by',
        channel: '{channel}',
        formatter: {
          channel: defaultGitlabChannelFormatter,
        },
      },
      isContribution: true,
      calculateSentiment: false,
    },
    [GitActivityType.TESTED_COMMIT]: {
      display: {
        default: 'tested a commit in {channel}',
        short: 'tested a commit',
        author: 'tested by',
        channel: '{channel}',
        formatter: {
          channel: defaultGitlabChannelFormatter,
        },
      },
      isContribution: true,
      calculateSentiment: false,
    },
    [GitActivityType.CO_AUTHORED_COMMIT]: {
      display: {
        default: 'co-authored a commit in {channel}',
        short: 'co-authored a commit',
        author: 'co-authored by',
        channel: '{channel}',
        formatter: {
          channel: defaultGitlabChannelFormatter,
        },
      },
      isContribution: true,
      calculateSentiment: false,
    },
    [GitActivityType.INFORMED_COMMIT]: {
      display: {
        default: 'informed a commit in {channel}',
        short: 'informed a commit',
        author: 'informed by',
        channel: '{channel}',
        formatter: {
          channel: defaultGitlabChannelFormatter,
        },
      },
      isContribution: true,
      calculateSentiment: false,
    },
    [GitActivityType.INFLUENCED_COMMIT]: {
      display: {
        default: 'influenced a commit in {channel}',
        short: 'influenced a commit',
        author: 'influenced by',
        channel: '{channel}',
        formatter: {
          channel: defaultGitlabChannelFormatter,
        },
      },
      isContribution: true,
      calculateSentiment: false,
    },
    [GitActivityType.APPROVED_COMMIT]: {
      display: {
        default: 'approved a commit in {channel}',
        short: 'approved a commit',
        author: 'approved by',
        channel: '{channel}',
        formatter: {
          channel: defaultGitlabChannelFormatter,
        },
      },
      isContribution: true,
      calculateSentiment: false,
    },
    [GitActivityType.COMMITTED_COMMIT]: {
      display: {
        default: 'committed in {channel}',
        short: 'committed',
        author: 'committed by',
        channel: '{channel}',
        formatter: {
          channel: defaultGitlabChannelFormatter,
        },
      },
      isContribution: true,
      calculateSentiment: false,
    },
    [GitActivityType.REPORTED_COMMIT]: {
      display: {
        default: 'reported a commit in {channel}',
        short: 'reported a commit',
        author: 'reported by',
        channel: '{channel}',
        formatter: {
          channel: defaultGitlabChannelFormatter,
        },
      },
      isContribution: true,
      calculateSentiment: false,
    },
    [GitActivityType.RESOLVED_COMMIT]: {
      display: {
        default: 'resolved a commit in {channel}',
        short: 'resolved a commit',
        author: 'resolved by',
        channel: '{channel}',
        formatter: {
          channel: defaultGitlabChannelFormatter,
        },
      },
      isContribution: true,
      calculateSentiment: false,
    },
    [GitActivityType.SIGNED_OFF_COMMIT]: {
      display: {
        default: 'signed off a commit in {channel}',
        short: 'signed off a commit',
        author: 'signed off by',
        channel: '{channel}',
        formatter: {
          channel: defaultGitlabChannelFormatter,
        },
      },
      isContribution: true,
      calculateSentiment: false,
    },
  },
}
