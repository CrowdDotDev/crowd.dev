import moment from 'moment'
import IntegrationRepository from '../../../../database/repositories/integrationRepository'
import SequelizeTestUtils from '../../../../database/utils/sequelizeTestUtils'
import { GitHubGrid } from '../../grid/githubGrid'
import TestEvents from './events'
import { PlatformType } from '../../../../types/integrationEnums'
import { GithubActivityType } from '../../../../types/activityTypes'
import { MemberAttributeName } from '../../../../database/attributes/member/enums'
import { IntegrationServiceBase } from '../../services/integrationServiceBase'
import { GithubIntegrationService } from '../../services/integrations/githubIntegrationService'
import { IStepContext } from '../../../../types/integration/stepResult'
import { getServiceLogger } from '../../../../utils/logging'

const db = null
const installId = '23585816'

const log = getServiceLogger()

async function fakeContext(integration = {}): Promise<IStepContext> {
  const options = await SequelizeTestUtils.getTestIRepositoryOptions(db)

  return {
    onboarding: false,
    integration,
    repoContext: options,
    serviceContext: options,
    limitCount: 0,
    startTimestamp: 0,
    logger: log,
    pipelineData: {},
  }
}

async function init(integration = false) {
  const options = await SequelizeTestUtils.getTestIRepositoryOptions(db)

  if (integration) {
    const integration = await IntegrationRepository.create(
      {
        platform: PlatformType.GITHUB,
        token: '',
        integrationIdentifier: installId,
      },
      options,
    )

    return {
      tenantId: options.currentTenant.id,
      integration,
    }
  }
  return {
    tenantId: options.currentTenant.id,
  }
}

describe('Github webhooks tests', () => {
  beforeEach(async () => {
    await SequelizeTestUtils.wipeDatabase(db)
  })

  afterAll(async () => {
    // Closing the DB connection allows Jest to exit successfully.
    await SequelizeTestUtils.closeConnection(db)
  })

  describe('Parse member tests', () => {
    it('It should parse a simple member', async () => {
      const member = {
        login: 'joanreyero',
        name: 'Joan Reyero',
        url: 'https://github.com/joanreyero',
      }
      const parsedMember = await GithubIntegrationService.parseMember(member, await fakeContext())
      const expected = {
        username: {
          [PlatformType.GITHUB]: 'joanreyero',
        },
        attributes: {
          [MemberAttributeName.IS_HIREABLE]: {
            [PlatformType.GITHUB]: false,
          },
          [MemberAttributeName.URL]: {
            [PlatformType.GITHUB]: 'https://github.com/joanreyero',
          },
          [MemberAttributeName.BIO]: {
            [PlatformType.GITHUB]: '',
          },
          [MemberAttributeName.AVATAR_URL]: {
            [PlatformType.GITHUB]: '',
          },
          [MemberAttributeName.LOCATION]: {
            [PlatformType.GITHUB]: '',
          },
        },
        emails: [],
        displayName: 'Joan Reyero',
      }
      expect(parsedMember).toStrictEqual(expected)
    })

    it('It should parse a member with Twitter', async () => {
      const member = {
        login: 'joanreyero',
        name: 'Joan Reyero',
        url: 'https://github.com/joanreyero',
        twitterUsername: 'reyero',
      }
      const parsedMember = await GithubIntegrationService.parseMember(member, await fakeContext())
      const expected = {
        username: {
          [PlatformType.GITHUB]: 'joanreyero',
          [PlatformType.TWITTER]: 'reyero',
        },
        attributes: {
          [MemberAttributeName.IS_HIREABLE]: {
            [PlatformType.GITHUB]: false,
          },
          [MemberAttributeName.URL]: {
            [PlatformType.GITHUB]: 'https://github.com/joanreyero',
            [PlatformType.TWITTER]: 'https://twitter.com/reyero',
          },
          [MemberAttributeName.AVATAR_URL]: {
            [PlatformType.GITHUB]: '',
          },
          [MemberAttributeName.BIO]: {
            [PlatformType.GITHUB]: '',
          },
          [MemberAttributeName.LOCATION]: {
            [PlatformType.GITHUB]: '',
          },
        },
        emails: [],
        displayName: 'Joan Reyero',
      }
      expect(parsedMember).toStrictEqual(expected)
    })

    it('It should parse a complete member without Twitter', async () => {
      const member = {
        login: 'joanreyero',
        name: 'Joan Reyero',
        isHitable: true,
        url: 'https://github.com/joanreyero',
        websiteUrl: 'https://crowd.dev',
        email: 'joan@crowd.dev',
        bio: 'Bio goes here',
        company: '@CrowdHQ ',
        location: 'Cambridge, UK',
        twitterUsername: 'reyero',
        followers: {
          totalCount: 10,
        },
      }
      const parsedMember = await GithubIntegrationService.parseMember(member, await fakeContext())
      const expected = {
        username: {
          [PlatformType.GITHUB]: 'joanreyero',
          [PlatformType.TWITTER]: 'reyero',
        },
        attributes: {
          [MemberAttributeName.IS_HIREABLE]: {
            [PlatformType.GITHUB]: false,
          },
          [MemberAttributeName.URL]: {
            [PlatformType.GITHUB]: 'https://github.com/joanreyero',
            [PlatformType.TWITTER]: 'https://twitter.com/reyero',
          },
          [MemberAttributeName.WEBSITE_URL]: {
            [PlatformType.GITHUB]: 'https://crowd.dev',
          },
          [MemberAttributeName.AVATAR_URL]: {
            [PlatformType.GITHUB]: '',
          },
          [MemberAttributeName.BIO]: {
            [PlatformType.GITHUB]: 'Bio goes here',
          },
          [MemberAttributeName.LOCATION]: {
            [PlatformType.GITHUB]: 'Cambridge, UK',
          },
        },
        reach: { [PlatformType.GITHUB]: 10 },
        emails: [],
        displayName: 'Joan Reyero',
        organizations: [{ name: 'crowd.dev' }],
      }
      expect(parsedMember).toStrictEqual(expected)
    })
  })

  describe('Issues tests', () => {
    it('It should parse an issue open coming from the GitHub API', async () => {
      const { tenantId, integration } = await init(true)
      const context = await fakeContext(integration)

      const issue = await GithubIntegrationService.parseWebhookIssue(
        TestEvents.issues.opened,
        context,
      )
      const expected = {
        member: {
          username: {
            [PlatformType.GITHUB]: 'testMember',
          },
        },
        type: GithubActivityType.ISSUE_OPENED,
        timestamp: new Date(TestEvents.issues.opened.issue.created_at),
        platform: PlatformType.GITHUB,
        tenant: tenantId.toString(),
        sourceId: TestEvents.issues.opened.issue.node_id,
        sourceParentId: null,
        url: TestEvents.issues.opened.issue.html_url,
        title: TestEvents.issues.opened.issue.title,
        body: TestEvents.issues.opened.issue.body,
        channel: TestEvents.issues.opened.repository.html_url,
        attributes: {
          state: TestEvents.issues.opened.issue.state,
        },
        score: GitHubGrid.issueOpened.score,
        isContribution: GitHubGrid.issueOpened.isContribution,
      }
      expect(issue).toStrictEqual(expected)
    })

    it('It should parse an issue edited coming from the GitHub API', async () => {
      const { tenantId, integration } = await init(true)
      const context = await fakeContext(integration)

      const issue = await GithubIntegrationService.parseWebhookIssue(
        TestEvents.issues.edited,
        context,
      )

      const expected = {
        member: {
          username: {
            [PlatformType.GITHUB]: 'testMember',
          },
        },
        type: GithubActivityType.ISSUE_OPENED,
        timestamp: new Date(TestEvents.issues.edited.issue.created_at),
        platform: PlatformType.GITHUB,
        tenant: tenantId.toString(),
        sourceId: TestEvents.issues.edited.issue.node_id,
        sourceParentId: null,
        url: TestEvents.issues.edited.issue.html_url,
        title: TestEvents.issues.edited.issue.title,
        body: TestEvents.issues.edited.issue.body,
        channel: TestEvents.issues.edited.repository.html_url,
        attributes: {
          state: TestEvents.issues.edited.issue.state,
        },
        score: GitHubGrid.issueOpened.score,
        isContribution: GitHubGrid.issueOpened.isContribution,
      }
      expect(issue).toStrictEqual(expected)
    })

    it('It should parse an issue reopened coming from the GitHub API', async () => {
      const { tenantId, integration } = await init(true)
      const context = await fakeContext(integration)

      const issue = await GithubIntegrationService.parseWebhookIssue(
        TestEvents.issues.reopened,
        context,
      )

      const expected = {
        member: {
          username: {
            [PlatformType.GITHUB]: 'testMember',
          },
        },
        type: GithubActivityType.ISSUE_OPENED,
        timestamp: new Date(TestEvents.issues.reopened.issue.created_at),
        platform: PlatformType.GITHUB,
        tenant: tenantId.toString(),
        sourceId: TestEvents.issues.reopened.issue.node_id,
        sourceParentId: null,
        url: TestEvents.issues.reopened.issue.html_url,
        title: TestEvents.issues.reopened.issue.title,
        body: TestEvents.issues.reopened.issue.body,
        channel: TestEvents.issues.reopened.repository.html_url,
        attributes: {
          state: TestEvents.issues.opened.issue.state,
        },
        score: GitHubGrid.issueOpened.score,
        isContribution: GitHubGrid.issueOpened.isContribution,
      }
      expect(issue).toStrictEqual(expected)
    })

    it('It should parse an issue closed coming from the GitHub API', async () => {
      const { tenantId, integration } = await init(true)
      const context = await fakeContext(integration)

      const issue = await GithubIntegrationService.parseWebhookIssue(
        TestEvents.issues.closed,
        context,
      )

      const expected = {
        member: {
          username: {
            [PlatformType.GITHUB]: 'testMember',
          },
        },
        type: GithubActivityType.ISSUE_CLOSED,
        timestamp: new Date(TestEvents.issues.closed.issue.closed_at),
        platform: PlatformType.GITHUB,
        tenant: tenantId,
        sourceId: TestEvents.issues.closed.issue.node_id,
        sourceParentId: null,
        url: TestEvents.issues.closed.issue.html_url,
        title: TestEvents.issues.closed.issue.title,
        channel: TestEvents.issues.closed.repository.html_url,
        body: TestEvents.issues.closed.issue.body,
        attributes: {
          state: TestEvents.issues.closed.issue.state,
        },
        score: GitHubGrid.issueClosed.score,
        isContribution: GitHubGrid.issueClosed.isContribution,
      }
      expect(issue).toStrictEqual(expected)
    })

    it('processWebhook should not return any operations for unsupported actions', async () => {
      const { integration } = await init(true)
      const context = await fakeContext(integration)

      const service = new GithubIntegrationService()

      const actions = [
        'deleted',
        'pinned',
        'unpinned',
        'assigned',
        'unassigned',
        'labeled',
        'unlabeled',
        'locked',
        'unlocked',
        'transferred',
        'milestoned',
        'demilestoned',
      ]

      for (const action of actions) {
        const webhook = {
          payload: {
            signature: '',
            event: 'issues',
            data: {
              action,
            },
          },
        }

        const result = await service.processWebhook(webhook, context)
        expect(result.operations).toStrictEqual([])
      }
    })
  })

  describe('Discussion tests', () => {
    it('It should parse a discussion created event coming from the GitHub API', async () => {
      const { tenantId, integration } = await init(true)
      const context = await fakeContext(integration)
      const discussion = await GithubIntegrationService.parseWebhookDiscussion(
        TestEvents.discussion.created,
        context,
      )

      const expected = {
        member: {
          username: {
            [PlatformType.GITHUB]: 'testMember',
          },
        },
        type: GithubActivityType.DISCUSSION_STARTED,
        timestamp: new Date(TestEvents.discussion.created.discussion.created_at),
        platform: PlatformType.GITHUB,
        tenant: tenantId.toString(),
        sourceId: TestEvents.discussion.created.discussion.node_id,
        sourceParentId: null,
        url: TestEvents.discussion.created.discussion.html_url,
        title: TestEvents.discussion.created.discussion.title,
        body: TestEvents.discussion.created.discussion.body,
        channel: TestEvents.discussion.created.repository.html_url,
        attributes: {
          category: {
            id: TestEvents.discussion.created.discussion.category.node_id,
            isAnswerable: TestEvents.discussion.created.discussion.category.is_answerable,
            name: TestEvents.discussion.created.discussion.category.name,
            slug: TestEvents.discussion.created.discussion.category.slug,
            emoji: TestEvents.discussion.created.discussion.category.emoji,
            description: TestEvents.discussion.created.discussion.category.description,
          },
        },
        score: GitHubGrid.discussionOpened.score,
        isContribution: GitHubGrid.discussionOpened.isContribution,
      }

      expect(discussion).toStrictEqual(expected)
    })

    it('It should parse a discussion edited event coming from the GitHub API', async () => {
      const { tenantId, integration } = await init(true)
      const context = await fakeContext(integration)
      const discussion = await GithubIntegrationService.parseWebhookDiscussion(
        TestEvents.discussion.edited,
        context,
      )

      const expected = {
        member: {
          username: {
            [PlatformType.GITHUB]: 'testMember',
          },
        },
        type: GithubActivityType.DISCUSSION_STARTED,
        timestamp: new Date(TestEvents.discussion.edited.discussion.created_at),
        platform: PlatformType.GITHUB,
        tenant: tenantId.toString(),
        sourceId: TestEvents.discussion.edited.discussion.node_id,
        sourceParentId: null,
        url: TestEvents.discussion.edited.discussion.html_url,
        title: TestEvents.discussion.edited.discussion.title,
        body: TestEvents.discussion.edited.discussion.body,
        channel: TestEvents.discussion.edited.repository.html_url,
        attributes: {
          category: {
            id: TestEvents.discussion.edited.discussion.category.node_id,
            isAnswerable: TestEvents.discussion.edited.discussion.category.is_answerable,
            name: TestEvents.discussion.edited.discussion.category.name,
            slug: TestEvents.discussion.edited.discussion.category.slug,
            emoji: TestEvents.discussion.edited.discussion.category.emoji,
            description: TestEvents.discussion.edited.discussion.category.description,
          },
        },
        score: GitHubGrid.discussionOpened.score,
        isContribution: GitHubGrid.discussionOpened.isContribution,
      }
      expect(discussion).toStrictEqual(expected)
    })

    it('It should parse a discussion answered event coming from the GitHub API', async () => {
      const { tenantId, integration } = await init(true)
      const context = await fakeContext(integration)
      const discussion = await GithubIntegrationService.parseWebhookDiscussion(
        TestEvents.discussion.answered,
        context,
      )
      const expected = {
        member: {
          username: {
            [PlatformType.GITHUB]: 'testMember',
          },
        },
        type: GithubActivityType.DISCUSSION_COMMENT,
        timestamp: new Date(TestEvents.discussion.answered.answer.created_at),
        platform: PlatformType.GITHUB,
        tenant: tenantId.toString(),
        sourceId: TestEvents.discussion.answered.answer.node_id,
        sourceParentId: TestEvents.discussion.answered.discussion.node_id,
        url: TestEvents.discussion.answered.answer.html_url,
        body: TestEvents.discussion.answered.answer.body,
        channel: TestEvents.discussion.answered.repository.html_url,
        attributes: {
          isSelectedAnswer: true,
        },
        score: GitHubGrid.discussionOpened.score,
        isContribution: GitHubGrid.discussionOpened.isContribution,
      }
      expect(discussion).toStrictEqual(expected)
    })
  })

  describe('Pull request tests', () => {
    it('It should parse an open PR coming from the GitHub API', async () => {
      const { tenantId, integration } = await init(true)
      const context = await fakeContext(integration)
      const pr = await GithubIntegrationService.parseWebhookPullRequest(
        TestEvents.pullRequests.opened,
        context,
      )

      const expected = {
        member: {
          username: {
            [PlatformType.GITHUB]: 'testMember',
          },
        },
        type: GithubActivityType.PULL_REQUEST_OPENED,
        timestamp: new Date(TestEvents.pullRequests.opened.pull_request.created_at),
        platform: PlatformType.GITHUB,
        tenant: tenantId,
        sourceId: TestEvents.pullRequests.opened.pull_request.node_id,
        sourceParentId: null,
        url: TestEvents.pullRequests.opened.pull_request.html_url,
        channel: TestEvents.pullRequests.opened.repository.html_url,
        title: TestEvents.pullRequests.opened.pull_request.title,
        body: TestEvents.pullRequests.opened.pull_request.body,
        score: GitHubGrid.pullRequestOpened.score,
        isContribution: GitHubGrid.pullRequestOpened.isContribution,
      }
      expect(pr).toStrictEqual(expected)
    })

    it('It should parse an edited PR coming from the GitHub API', async () => {
      const { tenantId, integration } = await init(true)
      const context = await fakeContext(integration)
      const pr = await GithubIntegrationService.parseWebhookPullRequest(
        TestEvents.pullRequests.edited,
        context,
      )

      const expected = {
        member: {
          username: {
            [PlatformType.GITHUB]: 'testMember',
          },
        },
        type: GithubActivityType.PULL_REQUEST_OPENED,
        timestamp: new Date(TestEvents.pullRequests.edited.pull_request.created_at),
        platform: PlatformType.GITHUB,
        tenant: tenantId,
        sourceId: TestEvents.pullRequests.edited.pull_request.node_id,
        sourceParentId: null,
        url: TestEvents.pullRequests.edited.pull_request.html_url,
        channel: TestEvents.pullRequests.edited.repository.html_url,
        title: TestEvents.pullRequests.edited.pull_request.title,
        body: TestEvents.pullRequests.edited.pull_request.body,
        score: GitHubGrid.pullRequestOpened.score,
        isContribution: GitHubGrid.pullRequestOpened.isContribution,
      }

      expect(pr).toStrictEqual(expected)
    })

    it('It should parse a reopened PR coming from the GitHub API', async () => {
      const { tenantId, integration } = await init(true)
      const context = await fakeContext(integration)
      const pr = await GithubIntegrationService.parseWebhookPullRequest(
        TestEvents.pullRequests.reopened,
        context,
      )

      const expected = {
        member: {
          username: {
            [PlatformType.GITHUB]: 'testMember',
          },
        },
        type: GithubActivityType.PULL_REQUEST_OPENED,
        timestamp: new Date(TestEvents.pullRequests.reopened.pull_request.created_at),
        platform: PlatformType.GITHUB,
        tenant: tenantId,
        sourceId: TestEvents.pullRequests.reopened.pull_request.node_id,
        sourceParentId: null,
        url: TestEvents.pullRequests.reopened.pull_request.html_url,
        title: TestEvents.pullRequests.reopened.pull_request.title,
        body: TestEvents.pullRequests.reopened.pull_request.body,
        channel: TestEvents.pullRequests.reopened.repository.html_url,

        score: GitHubGrid.pullRequestOpened.score,
        isContribution: GitHubGrid.pullRequestOpened.isContribution,
      }
      expect(pr).toStrictEqual(expected)
    })

    it('It should parse a closed PR coming from the GitHub API', async () => {
      const { tenantId, integration } = await init(true)
      const context = await fakeContext(integration)
      const pr = await GithubIntegrationService.parseWebhookPullRequest(
        TestEvents.pullRequests.closed,
        context,
      )

      const expected = {
        member: {
          username: {
            [PlatformType.GITHUB]: 'testMember',
          },
        },
        type: GithubActivityType.PULL_REQUEST_CLOSED,
        timestamp: new Date(TestEvents.pullRequests.closed.pull_request.closed_at),
        platform: PlatformType.GITHUB,
        tenant: tenantId,
        sourceId: TestEvents.pullRequests.closed.pull_request.node_id,
        sourceParentId: null,
        url: TestEvents.pullRequests.closed.pull_request.html_url,
        title: TestEvents.pullRequests.closed.pull_request.title,
        body: TestEvents.pullRequests.closed.pull_request.body,
        channel: TestEvents.pullRequests.closed.repository.html_url,
        score: GitHubGrid.pullRequestClosed.score,
        isContribution: GitHubGrid.pullRequestClosed.isContribution,
      }
      expect(pr).toStrictEqual(expected)
    })

    it('processWebhook should not return any operations for unsupported actions', async () => {
      const { integration } = await init(true)
      const context = await fakeContext(integration)

      const service = new GithubIntegrationService()

      const actions = [
        'assigned',
        'auto_merge_disabled',
        'auto_merge_enabled',
        'converted_to_draft',
        'labeled',
        'locked',
        'ready_for_review',
        'review_request_removed',
        'review_requested',
        'synchronize',
        'unassigned',
        'unlabeled',
        'unlocked',
      ]
      for (const action of actions) {
        const webhook = {
          payload: {
            signature: '',
            event: 'pull_request',
            data: {
              action,
            },
          },
        }

        const result = await service.processWebhook(webhook, context)
        expect(result.operations).toStrictEqual([])
      }
    })
  })

  describe('Star tests', () => {
    it('It should parse a star event coming from the GitHub API', async () => {
      const { tenantId, integration } = await init(true)
      const context = await fakeContext(integration)
      const star = await GithubIntegrationService.parseWebhookStar(TestEvents.star.created, context)

      const expected = {
        member: {
          username: {
            [PlatformType.GITHUB]: 'testMember',
          },
        },
        type: GithubActivityType.STAR,
        platform: PlatformType.GITHUB,
        tenant: tenantId,
        timestamp: moment(TestEvents.star.created.starred_at).toDate(),
        sourceId: IntegrationServiceBase.generateSourceIdHash(
          'joanreyero',
          GithubActivityType.STAR,
          moment(TestEvents.star.created.starred_at).unix().toString(),
          PlatformType.GITHUB,
        ),
        sourceParentId: null,
        channel: TestEvents.star.created.repository.html_url,
        score: 2,
        isContribution: false,
      }
      expect(star).toStrictEqual(expected)
    })

    it('It should parse an unstar event coming from the GitHub API', async () => {
      const { tenantId, integration } = await init(true)
      const context = await fakeContext(integration)
      const star = await GithubIntegrationService.parseWebhookStar(TestEvents.star.deleted, context)

      const starTimestamp = star.timestamp
      delete star.timestamp
      const expected = {
        member: {
          username: {
            [PlatformType.GITHUB]: 'testMember',
          },
        },
        type: GithubActivityType.UNSTAR,
        platform: PlatformType.GITHUB,
        tenant: tenantId,
        sourceId: IntegrationServiceBase.generateSourceIdHash(
          'joanreyero',
          GithubActivityType.UNSTAR,
          moment(starTimestamp).unix().toString(),
          PlatformType.GITHUB,
        ),
        sourceParentId: null,
        channel: TestEvents.star.deleted.repository.html_url,
        score: -2,
        isContribution: false,
      }
      expect(star).toStrictEqual(expected)
      // Check timestamp
      expect(moment(starTimestamp).unix()).toBeCloseTo(moment().unix(), 3)
    })
  })

  describe('Fork tests', () => {
    it('It should parse a fork event coming from the GitHub API', async () => {
      const { tenantId, integration } = await init(true)
      const context = await fakeContext(integration)
      const fork = await GithubIntegrationService.parseWebhookFork(TestEvents.fork.created, context)

      const expected = {
        member: {
          username: {
            [PlatformType.GITHUB]: 'testMember',
          },
        },
        type: GithubActivityType.FORK,
        timestamp: new Date(TestEvents.fork.created.forkee.created_at),
        platform: PlatformType.GITHUB,
        tenant: tenantId,
        sourceId: TestEvents.fork.created.forkee.node_id,
        sourceParentId: null,
        channel: TestEvents.fork.created.repository.html_url,
        score: 4,
        isContribution: true,
      }
      expect(fork).toStrictEqual(expected)
    })
  })

  describe('Comments tests', () => {
    it('It should parse an issue comment created event coming from the GitHub API', async () => {
      const { tenantId, integration } = await init(true)
      const context = await fakeContext(integration)
      const issue = await GithubIntegrationService.parseWebhookIssue(
        TestEvents.issues.opened,
        context,
      )

      const payload = TestEvents.comment.issue.created
      payload.issue.node_id = issue.sourceId
      const event = TestEvents.comment.event

      const comment = await GithubIntegrationService.parseWebhookComment(event, payload, context)

      const expected = {
        member: {
          username: {
            [PlatformType.GITHUB]: 'testMember',
          },
        },
        type: GithubActivityType.ISSUE_COMMENT,
        timestamp: new Date(TestEvents.comment.issue.created.comment.created_at),
        platform: PlatformType.GITHUB,
        tenant: tenantId,
        sourceId: TestEvents.comment.issue.created.comment.node_id,
        sourceParentId: TestEvents.comment.issue.created.issue.node_id,
        url: TestEvents.comment.issue.created.comment.html_url,
        body: TestEvents.comment.issue.created.comment.body,
        channel: TestEvents.comment.issue.created.repository.html_url,
        score: GitHubGrid.comment.score,
        isContribution: GitHubGrid.comment.isContribution,
      }
      expect(comment).toStrictEqual(expected)
    })

    it('It should parse an issue comment edited event coming from the GitHub API', async () => {
      const { tenantId, integration } = await init(true)
      const context = await fakeContext(integration)
      const issue = await GithubIntegrationService.parseWebhookIssue(
        TestEvents.issues.opened,
        context,
      )

      let payload = TestEvents.comment.issue.created
      payload.issue.node_id = issue.sourceId
      let event = TestEvents.comment.event

      await GithubIntegrationService.parseWebhookComment(event, payload, context)

      payload = TestEvents.comment.issue.edited
      payload.issue.node_id = issue.sourceId
      event = TestEvents.comment.event

      const comment = await GithubIntegrationService.parseWebhookComment(event, payload, context)

      const expected = {
        member: {
          username: {
            [PlatformType.GITHUB]: 'testMember',
          },
        },
        type: GithubActivityType.ISSUE_COMMENT,
        timestamp: new Date(TestEvents.comment.issue.edited.comment.created_at),
        platform: PlatformType.GITHUB,
        tenant: tenantId,
        sourceId: TestEvents.comment.issue.edited.comment.node_id,
        sourceParentId: TestEvents.comment.issue.edited.issue.node_id,
        url: TestEvents.comment.issue.edited.comment.html_url,
        body: TestEvents.comment.issue.edited.comment.body,
        channel: TestEvents.comment.issue.edited.repository.html_url,
        score: GitHubGrid.comment.score,
        isContribution: GitHubGrid.comment.isContribution,
      }
      expect(comment).toStrictEqual(expected)
    })

    it('It should parse a pull request comment created event coming from the GitHub API', async () => {
      const { tenantId, integration } = await init(true)
      const context = await fakeContext(integration)
      const pull = await GithubIntegrationService.parseWebhookPullRequest(
        TestEvents.pullRequests.opened,
        context,
      )

      const payload = TestEvents.comment.pullRequest.created
      payload.issue.node_id = pull.sourceId
      const event = TestEvents.comment.event

      const comment = await GithubIntegrationService.parseWebhookComment(event, payload, context)

      const expected = {
        member: {
          username: {
            [PlatformType.GITHUB]: 'testMember',
          },
        },
        type: GithubActivityType.PULL_REQUEST_COMMENT,
        timestamp: new Date(TestEvents.comment.pullRequest.created.comment.created_at),
        platform: PlatformType.GITHUB,
        tenant: tenantId,
        sourceId: TestEvents.comment.pullRequest.created.comment.node_id,
        sourceParentId: TestEvents.comment.pullRequest.created.issue.node_id,
        url: TestEvents.comment.pullRequest.created.comment.html_url,
        body: TestEvents.comment.pullRequest.created.comment.body,
        channel: TestEvents.comment.pullRequest.created.repository.html_url,
        score: GitHubGrid.comment.score,
        isContribution: GitHubGrid.comment.isContribution,
      }
      expect(comment).toStrictEqual(expected)
    })
    it('It should parse a pull request comment edited event coming from the GitHub API', async () => {
      const { tenantId, integration } = await init(true)
      const context = await fakeContext(integration)
      const pull = await GithubIntegrationService.parseWebhookPullRequest(
        TestEvents.pullRequests.opened,
        context,
      )

      let payload = TestEvents.comment.pullRequest.created
      payload.issue.node_id = pull.sourceId
      let event = TestEvents.comment.event

      await GithubIntegrationService.parseWebhookComment(event, payload, context)

      payload = TestEvents.comment.pullRequest.edited
      payload.issue.node_id = pull.sourceId
      event = TestEvents.comment.event

      const comment = await GithubIntegrationService.parseWebhookComment(event, payload, context)

      const expected = {
        member: {
          username: {
            [PlatformType.GITHUB]: 'testMember',
          },
        },
        type: GithubActivityType.PULL_REQUEST_COMMENT,
        timestamp: new Date(TestEvents.comment.pullRequest.edited.comment.created_at),
        platform: PlatformType.GITHUB,
        tenant: tenantId,
        sourceId: TestEvents.comment.pullRequest.edited.comment.node_id,
        sourceParentId: TestEvents.comment.pullRequest.edited.issue.node_id,
        url: TestEvents.comment.pullRequest.edited.comment.html_url,
        body: TestEvents.comment.pullRequest.edited.comment.body,
        channel: TestEvents.comment.pullRequest.edited.repository.html_url,
        score: GitHubGrid.comment.score,
        isContribution: GitHubGrid.comment.isContribution,
      }
      expect(comment).toStrictEqual(expected)
    })

    it('processWebhook should not return any operations for unsupported actions', async () => {
      const { integration } = await init(true)
      const context = await fakeContext(integration)

      const service = new GithubIntegrationService()

      const actions = ['deleted']
      for (const action of actions) {
        const webhook = {
          payload: {
            signature: '',
            event: 'issue_comment',
            data: {
              action,
            },
          },
        }

        const result = await service.processWebhook(webhook, context)
        expect(result.operations).toStrictEqual([])
      }
    })

    it('It should parse a discussion comment created event coming from the GitHub API', async () => {
      const { tenantId, integration } = await init(true)
      const context = await fakeContext(integration)
      const discussion = await GithubIntegrationService.parseWebhookDiscussion(
        TestEvents.discussion.created,
        context,
      )

      const payload = TestEvents.discussionComment.created
      payload.discussion.node_id = discussion.sourceId
      const event = TestEvents.discussionComment.event

      const comment = await GithubIntegrationService.parseWebhookComment(event, payload, context)

      const expected = {
        member: {
          username: {
            [PlatformType.GITHUB]: 'testMember',
          },
        },
        type: GithubActivityType.DISCUSSION_COMMENT,
        timestamp: new Date(TestEvents.discussionComment.created.comment.created_at),
        platform: PlatformType.GITHUB,
        tenant: tenantId,
        sourceId: TestEvents.discussionComment.created.comment.node_id,
        sourceParentId: TestEvents.discussionComment.created.discussion.node_id,
        url: TestEvents.discussionComment.created.comment.html_url,
        body: TestEvents.discussionComment.created.comment.body,
        channel: TestEvents.discussionComment.created.repository.html_url,
        score: GitHubGrid.comment.score,
        isContribution: GitHubGrid.comment.isContribution,
      }
      expect(comment).toStrictEqual(expected)
    })

    it('It should parse a discussion comment edited event coming from the GitHub API', async () => {
      const { tenantId, integration } = await init(true)
      const context = await fakeContext(integration)
      const discussion = await GithubIntegrationService.parseWebhookDiscussion(
        TestEvents.discussion.created,
        context,
      )

      let payload = TestEvents.discussionComment.created
      payload.discussion.node_id = discussion.sourceId
      let event = TestEvents.discussionComment.event

      await GithubIntegrationService.parseWebhookComment(event, payload, context)

      payload = TestEvents.discussionComment.edited
      payload.discussion.node_id = discussion.sourceId
      event = TestEvents.discussionComment.event

      const comment = await GithubIntegrationService.parseWebhookComment(event, payload, context)

      const expected = {
        member: {
          username: {
            [PlatformType.GITHUB]: 'testMember',
          },
        },
        type: GithubActivityType.DISCUSSION_COMMENT,
        timestamp: new Date(TestEvents.discussionComment.edited.comment.created_at),
        platform: PlatformType.GITHUB,
        tenant: tenantId,
        sourceId: TestEvents.discussionComment.edited.comment.node_id,
        sourceParentId: TestEvents.discussionComment.edited.discussion.node_id,
        url: TestEvents.discussionComment.edited.comment.html_url,
        body: TestEvents.discussionComment.edited.comment.body,
        channel: TestEvents.discussionComment.edited.repository.html_url,
        score: GitHubGrid.comment.score,
        isContribution: GitHubGrid.comment.isContribution,
      }
      expect(comment).toStrictEqual(expected)
    })
  })
})
