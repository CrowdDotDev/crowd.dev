import moment from 'moment'
import verifyGithubWebhook from 'verify-github-webhook'
import { IS_TEST_ENV, GITHUB_CONFIG } from '../../../config'
import IntegrationRepository from '../../../database/repositories/integrationRepository'
import getUserContext from '../../../database/utils/getUserContext'
import { GitHubGrid } from '../grid/githubGrid'
import ActivityService from '../../../services/activityService'
import { AddActivitiesSingle, Member } from '../types/messageTypes'
import getMember from '../usecases/github/graphql/members'
import { PlatformType } from '../../../types/integrationEnums'
import { GithubActivityType } from '../../../types/activityTypes'
import { gridEntry } from '../grid/grid'
import { MemberAttributeName } from '../../../database/attributes/member/enums'
import getOrganization from '../usecases/github/graphql/organizations'
import { IntegrationServiceBase } from '../services/integrationServiceBase'

type EventOutput = Promise<AddActivitiesSingle | null>

export default class GitHubWebhook {
  static platform = PlatformType.GITHUB

  integration: Object

  event: string

  payload: any

  constructor(event: string, payload: Object) {
    this.event = event
    this.payload = payload
  }

  /**
   * Find the integration a payload belongs to
   * @param identifier Integration identifier
   * @returns The integration the payload belongs to
   */
  async findIntegration(): Promise<Object> {
    const identifier: string = this.payload.installation.id.toString()
    return IntegrationRepository.findByIdentifier(identifier, PlatformType.GITHUB)
  }

  /**
   *
   * @param integration Integration found
   * @returns
   */
  static getTenantId(integration): string {
    return integration.tenantId.toString()
  }

  /**
   * Parse an issue activity given the payload coming from the GitHub webhook.
   * It will get the member that performed the activity. If it exists,
   * it will create a GitHub activity.
   * @param type The type of event: opened or closed
   * @returns The issue activity or null
   */
  async issue(type: GithubActivityType, scoreGrid: gridEntry, timestamp: string): EventOutput {
    const integration = (await this.findIntegration()) as any
    const issue = this.payload.issue
    const member: Member = await GitHubWebhook.getParsedMember(issue.user.login, integration.token)

    if (member) {
      return {
        member,
        type,
        timestamp: moment(timestamp).utc().toDate(),
        platform: PlatformType.GITHUB,
        tenant: GitHubWebhook.getTenantId(integration),
        sourceId: issue.node_id.toString(),
        sourceParentId: null,
        url: issue.html_url,
        title: issue.title,
        channel: this.payload.repository.html_url,
        body: issue.body,
        attributes: {
          state: issue.state,
        },
        score: scoreGrid.score,
        isKeyAction: scoreGrid.isKeyAction,
      }
    }
    return null
  }

  /**
   * Parse a pull activity given the payload coming from the GitHub webhook.
   * It will get the member that performed the activity. If it exists,
   * it will create a GitHub activity.
   * @param type The type of event: opened or closed
   * @returns The pull activity or null
   */
  async pullRequest(
    type: GithubActivityType,
    scoreGrid: gridEntry,
    timestamp: string,
  ): EventOutput {
    const integration = (await this.findIntegration()) as any
    const pull = this.payload.pull_request
    const member: Member = await GitHubWebhook.getParsedMember(pull.user.login, integration.token)
    if (member) {
      return {
        member,
        type,
        timestamp: moment(timestamp).utc().toDate(),
        platform: PlatformType.GITHUB,
        tenant: GitHubWebhook.getTenantId(integration),
        sourceId: pull.node_id.toString(),
        sourceParentId: null,
        url: pull.html_url,
        title: pull.title,
        channel: this.payload.repository.html_url,
        body: pull.body,
        score: scoreGrid.score,
        isKeyAction: scoreGrid.isKeyAction,
      }
    }
    return null
  }

  /**
   * Parse a discussion started activity into crowd activities using the payload coming from the GitHub webhook.
   * @returns The discussion-started activity or null
   */
  async discussion(): EventOutput {
    const integration = (await this.findIntegration()) as any
    const discussion = this.payload.discussion
    const member: Member = await GitHubWebhook.getParsedMember(
      discussion.user.login,
      integration.token,
    )
    if (member) {
      return {
        member,
        type: GithubActivityType.DISCUSSION_STARTED,
        timestamp: moment(discussion.created_at).utc().toDate(),
        platform: PlatformType.GITHUB,
        tenant: GitHubWebhook.getTenantId(integration),
        sourceId: discussion.node_id.toString(),
        sourceParentId: null,
        url: discussion.html_url,
        title: discussion.title,
        channel: this.payload.repository.html_url,
        body: discussion.body,
        attributes: {
          category: {
            id: discussion.category.node_id,
            isAnswerable: discussion.category.is_answerable,
            name: discussion.category.name,
            slug: discussion.category.slug,
            emoji: discussion.category.emoji,
            description: discussion.category.description,
          },
        },
        score: GitHubGrid.discussionOpened.score,
        isKeyAction: GitHubGrid.discussionOpened.isKeyAction,
      }
    }
    return null
  }

  /**
   * Parse a star activity into crowd activities using the payload coming from the GitHub webhook.
   * @param type The type of event: opened(star) or closed(unstar)
   * @returns The star activity or null
   */
  async star(type: string): EventOutput {
    const integration = (await this.findIntegration()) as any
    const member: Member = await GitHubWebhook.getParsedMember(
      this.payload.sender.login,
      integration.token,
    )
    if (member) {
      const timestampObject = moment().utc()
      return {
        member,
        type,
        timestamp: timestampObject.toDate(),
        platform: PlatformType.GITHUB,
        tenant: GitHubWebhook.getTenantId(integration),
        sourceId: IntegrationServiceBase.generateSourceIdHash(
          this.payload.sender.login,
          type,
          timestampObject.unix().toString(),
          PlatformType.GITHUB,
        ),
        sourceParentId: null,
        channel: this.payload.repository.html_url,
        score: type === 'star' ? GitHubGrid.star.score : GitHubGrid.unStar.score,
        isKeyAction: GitHubGrid.star.isKeyAction,
      }
    }
    return null
  }

  /**
   * Parse a fork activity given the payload coming from the GitHub webhook.
   * It will get the member that performed the activity. If it exists,
   * it will create a GitHub activity.
   * @param type The type of event: opened or closed
   * @returns The fork activity or null
   */
  async fork(): EventOutput {
    const integration = (await this.findIntegration()) as any
    const member: Member = await GitHubWebhook.getParsedMember(
      this.payload.sender.login,
      integration.token,
    )
    if (member) {
      return {
        member,
        type: GithubActivityType.FORK,
        timestamp: moment(this.payload.forkee.created_at).utc().toDate(),
        platform: PlatformType.GITHUB,
        tenant: GitHubWebhook.getTenantId(integration),
        sourceId: this.payload.forkee.node_id.toString(),
        sourceParentId: null,
        channel: this.payload.repository.html_url,
        score: GitHubGrid.fork.score,
        isKeyAction: GitHubGrid.fork.isKeyAction,
      }
    }
    return null
  }

  /**
   * Parse a comment activity given the payload coming from the GitHub webhook.
   * It will get the member that performed the activity. If it exists,
   * it will create a GitHub activity.
   * @param type The type of event: comments can be generated from various
   * places: issue-comment, pull_request-comment, discussion-comment
   * @param sourceParentId remoted parent id of the comment. It can be
   * a discussion-started, issue-created, or pull_request-opened activity id.
   * @returns The comment activity or null
   */
  async comment(type: string, sourceParentId: string): EventOutput {
    const integration = (await this.findIntegration()) as any
    const member: Member = await GitHubWebhook.getParsedMember(
      this.payload.sender.login,
      integration.token,
    )
    if (member) {
      const comment = this.payload.comment
      return {
        member,
        type,
        timestamp: moment(comment.created_at).utc().toDate(),
        platform: PlatformType.GITHUB,
        tenant: GitHubWebhook.getTenantId(integration),
        sourceId: comment.node_id.toString(),
        sourceParentId,
        url: comment.html_url,
        body: comment.body,
        channel: this.payload.repository.html_url,
        score: GitHubGrid.comment.score,
        isKeyAction: GitHubGrid.comment.isKeyAction,
      }
    }
    return null
  }

  /**
   * Parse a discussion answered activity given the payload coming from the GitHub webhook.
   * We will be updating score and attributes.isSelectedAnswer for the already
   * existing discussion comment.
   * @param type Any comment type activity can be marked as an answer:
   * issue-comment, pull_request-comment, discussion-comment
   * @param sourceParentId remoted parent id of the comment. It can be
   * a discussion-started, issue-created, or pull_request-opened activity id.
   * @returns The answer comment activity or null
   */
  async answer(type: string, sourceParentId: string): EventOutput {
    const integration = (await this.findIntegration()) as any
    const member: Member = await GitHubWebhook.getParsedMember(
      this.payload.sender.login,
      integration.token,
    )
    if (member) {
      const answer = this.payload.answer
      return {
        member,
        type,
        timestamp: moment(answer.created_at).utc().toDate(),
        platform: PlatformType.GITHUB,
        tenant: GitHubWebhook.getTenantId(integration),
        sourceId: answer.node_id.toString(),
        sourceParentId,
        attributes: {
          isSelectedAnswer: true,
        },
        channel: this.payload.repository.html_url,
        body: answer.body,
        url: answer.html_url,
        score: GitHubGrid.selectedAnswer.score,
        isKeyAction: GitHubGrid.selectedAnswer.isKeyAction,
      }
    }
    return null
  }

  /**
   * Get and parse a member using the GitHub API
   * @param login The username of the member
   * @param token The GitHub token of the integration
   * @returns A member object, or null
   */
  static async getParsedMember(login: string, token: string): Promise<Member | null> {
    if (IS_TEST_ENV) {
      return {
        username: {
          [PlatformType.GITHUB]: 'testMember',
        },
      }
    }
    const member = await getMember(login, token)
    if (member) {
      return GitHubWebhook.parseMember(member, token)
    }
    return member
  }

  /**
   * Parse a user object coming from the GitHub API into a Crowd.dev member.
   * @param member User object coming from the GitHub API
   * @returns The parsed member
   */
  static async parseMember(member: any, token): Promise<Member> {
    const parsedMember: Member = {
      username: { [PlatformType.GITHUB]: member.login },
      attributes: {
        [PlatformType.GITHUB]: {
          [MemberAttributeName.NAME]: member.name,
          [MemberAttributeName.IS_HIREABLE]: member.isHireable || false,
          [MemberAttributeName.URL]: member.url,
          [MemberAttributeName.BIO]: member.bio || '',
          [MemberAttributeName.LOCATION]: member.location || '',
        },
      },
      email: member.email || '',
      ...(member.company && { organizations: [member.company.trim()] }),
    }

    if (member.websiteUrl) {
      parsedMember.attributes[PlatformType.GITHUB][MemberAttributeName.WEBSITE_URL] =
        member.websiteUrl
    }

    if (member.twitterUsername) {
      parsedMember.attributes[PlatformType.TWITTER] = {
        [MemberAttributeName.URL]: `https://twitter.com/${member.twitterUsername}`,
      }
      parsedMember.username[PlatformType.TWITTER] = member.twitterUsername
    }

    if (member.company) {
      if (IS_TEST_ENV) {
        parsedMember.organizations = [{ name: 'crowd.dev' }]
      } else {
        const company = member.company.replace('@', '').trim()
        const fromAPI = await getOrganization(company, token)
        if (fromAPI) {
          parsedMember.organizations = [
            {
              name: fromAPI.name,
              ...(fromAPI.description && { description: fromAPI.description }),
              ...(fromAPI.location && { location: fromAPI.location }),
              ...(fromAPI.avatarUrl && { logo: fromAPI.avatarUrl }),
              ...(fromAPI.url && { url: fromAPI.url }),
              ...(fromAPI.twitter && { twittwe: { handle: fromAPI.twitterUsername } }),
            },
          ]
        } else {
          parsedMember.organizations = [{ name: company }]
        }
      }
    }

    return parsedMember
  }

  /**
   * Parse an event coming from the GitHub API into an activity.
   * If the event does not correspond to a supported event, it will return null.
   * @returns An activity to add to the database, nor null
   */
  async getActivityWithMember(): EventOutput {
    switch (this.event) {
      case 'issues':
        switch (this.payload.action) {
          case 'edited':
          case 'opened':
          case 'reopened':
            return this.issue(
              GithubActivityType.ISSUE_OPENED,
              GitHubGrid.issueOpened,
              this.payload.issue.created_at,
            )
          case 'closed':
            return this.issue(
              GithubActivityType.ISSUE_CLOSED,
              GitHubGrid.issueClosed,
              this.payload.issue.closed_at,
            )
          default:
            return null
        }

      case 'discussion':
        switch (this.payload.action) {
          case 'edited':
          case 'created':
            return this.discussion()
          case 'answered':
            return this.answer(
              GithubActivityType.DISCUSSION_COMMENT,
              this.payload.discussion.node_id.toString(),
            )
          default:
            return null
        }

      case 'pull_request':
        switch (this.payload.action) {
          case 'edited':
          case 'opened':
          case 'reopened':
            return this.pullRequest(
              GithubActivityType.PULL_REQUEST_OPENED,
              GitHubGrid.pullRequestOpened,
              this.payload.pull_request.created_at,
            )
          case 'closed':
            return this.pullRequest(
              GithubActivityType.PULL_REQUEST_CLOSED,
              GitHubGrid.pullRequestClosed,
              this.payload.pull_request.closed_at,
            )
          default:
            return null
        }

      case 'star':
        switch (this.payload.action) {
          case 'created':
            return this.star(GithubActivityType.STAR)
          case 'deleted':
            return this.star(GithubActivityType.UNSTAR)
          default:
            return null
        }

      case 'fork':
        return this.fork()

      case 'discussion_comment':
        switch (this.payload.action) {
          case 'created':
          case 'edited':
            return this.comment(
              GithubActivityType.DISCUSSION_COMMENT,
              this.payload.discussion.node_id.toString(),
            )
          default:
            return null
        }
      case 'issue_comment':
        switch (this.payload.action) {
          case 'created':
          case 'edited':
            if ('pull_request' in this.payload.issue) {
              return this.comment(
                GithubActivityType.PULL_REQUEST_COMMENT,
                this.payload.issue.node_id.toString(),
              )
            }
            return this.comment(
              GithubActivityType.ISSUE_COMMENT,
              this.payload.issue.node_id.toString(),
            )
          default:
            return null
        }

      default:
        return null
    }
  }

  /**
   * Verifies a request coming from GitHub webhooks
   * @param req The whole request
   * @returns The SQS message sent || Verification Error
   */
  static verify(req): void {
    try {
      const signature = req.headers['x-hub-signature']
      const secret = GITHUB_CONFIG.webhookSecret

      console.log('Verifying webhook...')
      const isVerified = verifyGithubWebhook(signature, JSON.stringify(req.body), secret) // Returns true if verification succeeds; otherwise, false.

      console.log('Verification', isVerified)
      if (!isVerified) {
        throw new Error('Webhook not verified')
      }
    } catch (err) {
      throw new Error(`Webhook not verified\n${err}`)
    }
  }

  async main(): Promise<any> {
    const activity = await this.getActivityWithMember()
    if (activity) {
      const userContext = await getUserContext(activity.tenant)
      return new ActivityService(userContext).createWithMember(activity)
    }

    return {
      message: 'Event not supported',
      info: `Event was ${this.event} of type  ${typeof this.event}. Action was ${
        this.payload.action
      }, with a payload type of ${typeof this.payload}.`,
      status: 204,
    }
  }
}
