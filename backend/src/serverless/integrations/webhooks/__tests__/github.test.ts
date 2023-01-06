import moment from 'moment'
import IntegrationRepository from '../../../../database/repositories/integrationRepository'
import SequelizeTestUtils from '../../../../database/utils/sequelizeTestUtils'
import Error404 from '../../../../errors/Error404'
import { GitHubGrid } from '../../grid/githubGrid'
import GitHubWebhook from '../github'
import TestEvents from './events'
import { PlatformType } from '../../../../types/integrationEnums'
import { GithubActivityType } from '../../../../types/activityTypes'
import { MemberAttributeName } from '../../../../database/attributes/member/enums'
import { IntegrationServiceBase } from '../../services/integrationServiceBase'

const db = null
const installId = '23585816'

async function init(event = '', payload = {}, integration = false) {
  const options = await SequelizeTestUtils.getTestIRepositoryOptions(db)
  let tenantId
  if (integration) {
    tenantId = (
      await IntegrationRepository.create(
        {
          platform: PlatformType.GITHUB,
          token: '',
          integrationIdentifier: installId,
        },
        options,
      )
    ).tenantId
  } else {
    tenantId = ''
  }
  return {
    gh: new GitHubWebhook(event, payload),
    tenantId,
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
      const parsedMember = await GitHubWebhook.parseMember(member, 'token')
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
        email: '',
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
      const parsedMember = await GitHubWebhook.parseMember(member, 'token')
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
        email: '',
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
      const parsedMember = await GitHubWebhook.parseMember(member, 'token')
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
        email: 'joan@crowd.dev',
        organizations: [{ name: 'crowd.dev' }],
      }
      expect(parsedMember).toStrictEqual(expected)
    })
  })

  describe('Find integrations test', () => {
    it('It should find integration with a correct install ID', async () => {
      const payload = {
        installation: {
          id: installId,
        },
      }
      const { gh } = await init('', payload, true)
      const integrations = await gh.findIntegration()
      expect(integrations).toBeDefined()
    })

    it('It should not find integration with a wrong tenant ID', async () => {
      const payload = {
        installation: {
          id: '42',
        },
      }
      const { gh } = await init('', payload, true)
      await expect(() => gh.findIntegration()).rejects.toThrowError(new Error404())
    })
  })

  describe('Issues tests', () => {
    it('It should parse an issue open coming from the GitHub API', async () => {
      const { tenantId, gh } = await init(TestEvents.issues.event, TestEvents.issues.opened, true)
      const issue = await gh.issue(
        GithubActivityType.ISSUE_OPENED,
        GitHubGrid.issueOpened,
        TestEvents.issues.opened.issue.created_at,
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
        isKeyAction: GitHubGrid.issueOpened.isKeyAction,
      }
      expect(issue).toStrictEqual(expected)

      const fromMain = await gh.getActivityWithMember()
      expect(fromMain).toStrictEqual(expected)

      const fromDb = await gh.main()
      expect(fromDb).toBeDefined()
    })

    it('It should parse an issue edited coming from the GitHub API', async () => {
      const { tenantId, gh } = await init(TestEvents.issues.event, TestEvents.issues.opened, true)

      const issueCreated = await gh.main()

      gh.payload = TestEvents.issues.edited
      gh.event = TestEvents.issues.event

      const issue = await gh.issue(
        GithubActivityType.ISSUE_OPENED,
        GitHubGrid.issueOpened,
        TestEvents.issues.edited.issue.created_at,
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
        isKeyAction: GitHubGrid.issueOpened.isKeyAction,
      }
      expect(issue).toStrictEqual(expected)

      const fromMain = await gh.getActivityWithMember()
      expect(fromMain).toStrictEqual(expected)

      const fromDb = await gh.main()

      expect(fromDb.id).toBe(issueCreated.id)
      expect(fromDb).toBeDefined()
    })

    it('It should parse an issue reopened coming from the GitHub API', async () => {
      const { tenantId, gh } = await init(TestEvents.issues.event, TestEvents.issues.reopened, true)
      const issue = await gh.issue(
        GithubActivityType.ISSUE_OPENED,
        GitHubGrid.issueOpened,
        TestEvents.issues.reopened.issue.created_at,
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
        isKeyAction: GitHubGrid.issueOpened.isKeyAction,
      }
      expect(issue).toStrictEqual(expected)

      const fromMain = await gh.getActivityWithMember()
      expect(fromMain).toStrictEqual(expected)

      const fromDb = await gh.main()
      expect(fromDb).toBeDefined()
    })

    it('It should parse an issue closed coming from the GitHub API', async () => {
      const { tenantId, gh } = await init(TestEvents.issues.event, TestEvents.issues.closed, true)
      const issue = await gh.issue(
        GithubActivityType.ISSUE_CLOSED,
        GitHubGrid.issueClosed,
        TestEvents.issues.closed.issue.closed_at,
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
        isKeyAction: GitHubGrid.issueClosed.isKeyAction,
      }
      expect(issue).toStrictEqual(expected)

      const fromMain = await gh.getActivityWithMember()
      expect(fromMain).toStrictEqual(expected)

      const fromDb = await gh.main()
      expect(fromDb).toBeDefined()
    })

    it('getActivityWithMember should throw an error for all other actions', async () => {
      const { gh } = await init(TestEvents.issues.event, TestEvents.issues.closed, true)

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
        gh.payload.action = action
        const fromMain = await gh.getActivityWithMember()
        expect(fromMain).toBeNull()

        try {
          await gh.main()
          fail('Should have thrown an error')
        } catch (err) {
          expect(err.action).toBe(
            `GitHub WebHook processing of event 'issues' of type 'string' with action '${action}', with a payload type of 'object'.`,
          )
        }
      }
    })
  })

  describe('Discussion tests', () => {
    it('It should parse a discussion created event coming from the GitHub API', async () => {
      const { tenantId, gh } = await init(
        TestEvents.discussion.event,
        TestEvents.discussion.created,
        true,
      )
      const discussion = await gh.discussion()
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
        isKeyAction: GitHubGrid.discussionOpened.isKeyAction,
      }
      expect(discussion).toStrictEqual(expected)

      const fromMain = await gh.getActivityWithMember()
      expect(fromMain).toStrictEqual(expected)

      const fromDb = await gh.main()
      expect(fromDb).toBeDefined()
    })

    it('It should parse a discussion edited event coming from the GitHub API', async () => {
      const { tenantId, gh } = await init(
        TestEvents.discussion.event,
        TestEvents.discussion.edited,
        true,
      )
      const discussion = await gh.discussion()
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
        isKeyAction: GitHubGrid.discussionOpened.isKeyAction,
      }
      expect(discussion).toStrictEqual(expected)

      const fromMain = await gh.getActivityWithMember()
      expect(fromMain).toStrictEqual(expected)

      const fromDb = await gh.main()
      expect(fromDb).toBeDefined()
    })

    it('It should parse a discussion answered event coming from the GitHub API', async () => {
      const { tenantId, gh } = await init(
        TestEvents.discussion.event,
        TestEvents.discussion.answered,
        true,
      )
      const discussion = await gh.answer(
        GithubActivityType.DISCUSSION_COMMENT,
        TestEvents.discussion.answered.discussion.node_id.toString(),
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
        isKeyAction: GitHubGrid.discussionOpened.isKeyAction,
      }
      expect(discussion).toStrictEqual(expected)

      const fromMain = await gh.getActivityWithMember()
      expect(fromMain).toStrictEqual(expected)

      const fromDb = await gh.main()
      expect(fromDb).toBeDefined()
    })
  })

  describe('Pull request tests', () => {
    it('It should parse an open PR coming from the GitHub API', async () => {
      const { tenantId, gh } = await init(
        TestEvents.pullRequests.event,
        TestEvents.pullRequests.opened,
        true,
      )
      const pr = await gh.pullRequest(
        GithubActivityType.PULL_REQUEST_OPENED,
        GitHubGrid.pullRequestOpened,
        TestEvents.pullRequests.opened.pull_request.created_at,
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
        isKeyAction: GitHubGrid.pullRequestOpened.isKeyAction,
      }
      expect(pr).toStrictEqual(expected)

      const fromMain = await gh.getActivityWithMember()
      expect(fromMain).toStrictEqual(expected)

      const fromDb = await gh.main()
      expect(fromDb).toBeDefined()
    })

    it('It should parse an edited PR coming from the GitHub API', async () => {
      const { tenantId, gh } = await init(
        TestEvents.pullRequests.event,
        TestEvents.pullRequests.opened,
        true,
      )

      const prCreated = await gh.main()

      gh.payload = TestEvents.pullRequests.edited
      gh.event = TestEvents.pullRequests.event

      const pr = await gh.pullRequest(
        GithubActivityType.PULL_REQUEST_OPENED,
        GitHubGrid.pullRequestOpened,
        TestEvents.pullRequests.edited.pull_request.created_at,
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
        isKeyAction: GitHubGrid.pullRequestOpened.isKeyAction,
      }
      expect(pr).toStrictEqual(expected)

      const fromMain = await gh.getActivityWithMember()
      expect(fromMain).toStrictEqual(expected)

      const fromDb = await gh.main()

      expect(fromDb.id).toBe(prCreated.id)
      expect(fromDb).toBeDefined()
    })

    it('It should parse a reopened PR coming from the GitHub API', async () => {
      const { tenantId, gh } = await init(
        TestEvents.pullRequests.event,
        TestEvents.pullRequests.reopened,
        true,
      )
      const pr = await gh.pullRequest(
        GithubActivityType.PULL_REQUEST_OPENED,
        GitHubGrid.pullRequestOpened,
        TestEvents.pullRequests.reopened.pull_request.created_at,
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
        isKeyAction: GitHubGrid.pullRequestOpened.isKeyAction,
      }
      expect(pr).toStrictEqual(expected)

      const fromMain = await gh.getActivityWithMember()
      expect(fromMain).toStrictEqual(expected)

      const fromDb = await gh.main()
      expect(fromDb).toBeDefined()
    })

    it('It should parse a closed PR coming from the GitHub API', async () => {
      const { tenantId, gh } = await init(
        TestEvents.pullRequests.event,
        TestEvents.pullRequests.closed,
        true,
      )
      const pr = await gh.pullRequest(
        GithubActivityType.PULL_REQUEST_CLOSED,
        GitHubGrid.pullRequestClosed,
        TestEvents.pullRequests.closed.pull_request.closed_at,
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
        isKeyAction: GitHubGrid.pullRequestClosed.isKeyAction,
      }
      expect(pr).toStrictEqual(expected)

      const fromMain = await gh.getActivityWithMember()
      expect(fromMain).toStrictEqual(expected)

      const fromDb = await gh.main()
      expect(fromDb).toBeDefined()
    })

    it('getActivityWithMember should throw an error for all other actions', async () => {
      const { gh } = await init(TestEvents.pullRequests.event, TestEvents.pullRequests.closed, true)

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
        gh.payload.action = action
        const fromMain = await gh.getActivityWithMember()
        expect(fromMain).toBeNull()

        try {
          await gh.main()
          fail('Should have thrown an error')
        } catch (err) {
          expect(err.action).toBe(
            `GitHub WebHook processing of event 'pull_request' of type 'string' with action '${action}', with a payload type of 'object'.`,
          )
        }
      }
    })
  })

  describe('Star tests', () => {
    it('It should parse a star event coming from the GitHub API', async () => {
      const { tenantId, gh } = await init(TestEvents.star.event, TestEvents.star.created, true)
      const star = await gh.star(GithubActivityType.STAR)

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
        isKeyAction: false,
      }
      expect(star).toStrictEqual(expected)
      // Check timestamp

      const fromMain = await gh.getActivityWithMember()
      expected.sourceId = IntegrationServiceBase.generateSourceIdHash(
        'joanreyero',
        'star',
        moment(fromMain.timestamp).unix().toString(),
        PlatformType.GITHUB,
      )

      expect(fromMain).toStrictEqual(expected)

      const fromDb = await gh.main()
      expect(fromDb).toBeDefined()
    })

    it('It should parse an unstar event coming from the GitHub API', async () => {
      const { tenantId, gh } = await init(TestEvents.star.event, TestEvents.star.deleted, true)
      const star = await gh.star(GithubActivityType.UNSTAR)
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
        isKeyAction: false,
      }
      expect(star).toStrictEqual(expected)
      // Check timestamp
      expect(moment(starTimestamp).unix()).toBeCloseTo(moment().unix(), 3)

      const fromMain = await gh.getActivityWithMember()
      expected.sourceId = IntegrationServiceBase.generateSourceIdHash(
        'joanreyero',
        GithubActivityType.UNSTAR,
        moment(fromMain.timestamp).unix().toString(),
        PlatformType.GITHUB,
      )

      delete fromMain.timestamp
      expect(fromMain).toStrictEqual(expected)

      const fromDb = await gh.main()
      expect(fromDb).toBeDefined()
    })
  })

  describe('Fork tests', () => {
    it('It should parse a fork event coming from the GitHub API', async () => {
      const { tenantId, gh } = await init(TestEvents.fork.event, TestEvents.fork.created, true)
      const fork = await gh.fork()
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
        isKeyAction: true,
      }
      expect(fork).toStrictEqual(expected)

      const fromMain = await gh.getActivityWithMember()
      expect(fromMain).toStrictEqual(expected)

      const fromDb = await gh.main()
      expect(fromDb).toBeDefined()
    })
  })

  describe('Comments tests', () => {
    it('It should parse an issue comment created event coming from the GitHub API', async () => {
      const { tenantId, gh } = await init(TestEvents.issues.event, TestEvents.issues.opened, true)
      const issue = await gh.main()

      gh.payload = TestEvents.comment.issue.created
      gh.payload.issue.node_id = issue.sourceId
      gh.event = TestEvents.comment.event

      const comment = await gh.comment(
        GithubActivityType.ISSUE_COMMENT,
        gh.payload.issue.node_id.toString(),
      )

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
        isKeyAction: GitHubGrid.comment.isKeyAction,
      }
      expect(comment).toStrictEqual(expected)

      const fromMain = await gh.getActivityWithMember()
      expect(fromMain).toStrictEqual(expected)

      const fromDb = await gh.main()
      expect(fromDb).toBeDefined()
      expect(fromDb.sourceParentId).toBe(issue.sourceId)
      expect(fromDb.parentId).toBe(issue.id)
    })

    it('It should parse an issue comment edited event coming from the GitHub API', async () => {
      const { tenantId, gh } = await init(TestEvents.issues.event, TestEvents.issues.opened, true)
      const issue = await gh.main()

      gh.payload = TestEvents.comment.issue.created
      gh.payload.issue.node_id = issue.sourceId
      gh.event = TestEvents.comment.event

      const commentCreated = await gh.main()

      gh.payload = TestEvents.comment.issue.edited
      gh.payload.issue.node_id = issue.sourceId
      gh.event = TestEvents.comment.event

      const comment = await gh.comment(
        GithubActivityType.ISSUE_COMMENT,
        gh.payload.issue.node_id.toString(),
      )

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
        isKeyAction: GitHubGrid.comment.isKeyAction,
      }
      expect(comment).toStrictEqual(expected)

      const fromMain = await gh.getActivityWithMember()
      expect(fromMain).toStrictEqual(expected)

      const fromDb = await gh.main()

      expect(fromDb).toBeDefined()
      expect(fromDb.id).toBe(commentCreated.id)
      expect(fromDb.sourceParentId).toBe(issue.sourceId)
      expect(fromDb.parentId).toBe(issue.id)
    })

    it('It should parse a pull request comment created event coming from the GitHub API', async () => {
      const { tenantId, gh } = await init(
        TestEvents.pullRequests.event,
        TestEvents.pullRequests.opened,
        true,
      )
      const pull = await gh.main()

      gh.payload = TestEvents.comment.pullRequest.created
      gh.payload.issue.node_id = pull.sourceId
      gh.event = TestEvents.comment.event

      const comment = await gh.comment(
        GithubActivityType.PULL_REQUEST_COMMENT,
        gh.payload.issue.node_id.toString(),
      )

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
        isKeyAction: GitHubGrid.comment.isKeyAction,
      }
      expect(comment).toStrictEqual(expected)

      const fromMain = await gh.getActivityWithMember()
      expect(fromMain).toStrictEqual(expected)

      const fromDb = await gh.main()
      expect(fromDb).toBeDefined()
      expect(fromDb.sourceParentId).toBe(pull.sourceId)
      expect(fromDb.parentId).toBe(pull.id)
    })
    it('It should parse a pull request comment edited event coming from the GitHub API', async () => {
      const { tenantId, gh } = await init(
        TestEvents.pullRequests.event,
        TestEvents.pullRequests.opened,
        true,
      )
      const pull = await gh.main()

      gh.payload = TestEvents.comment.pullRequest.created
      gh.payload.issue.node_id = pull.sourceId
      gh.event = TestEvents.comment.event

      const commentCreated = await gh.main()

      gh.payload = TestEvents.comment.pullRequest.edited
      gh.payload.issue.node_id = pull.sourceId
      gh.event = TestEvents.comment.event

      const comment = await gh.comment(
        GithubActivityType.PULL_REQUEST_COMMENT,
        gh.payload.issue.node_id.toString(),
      )

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
        isKeyAction: GitHubGrid.comment.isKeyAction,
      }
      expect(comment).toStrictEqual(expected)

      const fromMain = await gh.getActivityWithMember()
      expect(fromMain).toStrictEqual(expected)

      const fromDb = await gh.main()

      expect(fromDb).toBeDefined()
      expect(fromDb.id).toBe(commentCreated.id)
      expect(fromDb.sourceParentId).toBe(pull.sourceId)
      expect(fromDb.parentId).toBe(pull.id)
    })

    it('getActivityWithMember should throw an error for all other actions', async () => {
      const { gh } = await init(TestEvents.comment.event, TestEvents.comment.issue, true)

      const actions = ['deleted']
      for (const action of actions) {
        gh.payload.action = action
        const fromMain = await gh.getActivityWithMember()
        expect(fromMain).toBeNull()

        try {
          await gh.main()
          fail('Should have thrown error')
        } catch (err) {
          expect(err.actions).toBe(
            `GitHub WebHook processing of event 'issue_comment' of type 'string' with action '${action}', with a payload type of 'object'.`,
          )
        }
      }
    })
    it('It should parse a discussion comment created event coming from the GitHub API', async () => {
      const { tenantId, gh } = await init(
        TestEvents.discussion.event,
        TestEvents.discussion.created,
        true,
      )
      const discussion = await gh.main()

      gh.payload = TestEvents.discussionComment.created
      gh.payload.discussion.node_id = discussion.sourceId
      gh.event = TestEvents.discussionComment.event

      const comment = await gh.comment(
        GithubActivityType.DISCUSSION_COMMENT,
        gh.payload.discussion.node_id.toString(),
      )

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
        isKeyAction: GitHubGrid.comment.isKeyAction,
      }
      expect(comment).toStrictEqual(expected)

      const fromMain = await gh.getActivityWithMember()
      expect(fromMain).toStrictEqual(expected)

      const fromDb = await gh.main()
      expect(fromDb).toBeDefined()
      expect(fromDb.sourceParentId).toBe(discussion.sourceId)
      expect(fromDb.parentId).toBe(discussion.id)
    })

    it('It should parse a discussion comment edited event coming from the GitHub API', async () => {
      const { tenantId, gh } = await init(
        TestEvents.discussion.event,
        TestEvents.discussion.created,
        true,
      )
      const discussion = await gh.main()

      gh.payload = TestEvents.discussionComment.created
      gh.payload.discussion.node_id = discussion.sourceId
      gh.event = TestEvents.discussionComment.event

      const commentCreated = await gh.main()

      gh.payload = TestEvents.discussionComment.edited
      gh.payload.discussion.node_id = discussion.sourceId
      gh.event = TestEvents.discussionComment.event

      const comment = await gh.comment(
        GithubActivityType.DISCUSSION_COMMENT,
        gh.payload.discussion.node_id.toString(),
      )

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
        isKeyAction: GitHubGrid.comment.isKeyAction,
      }
      expect(comment).toStrictEqual(expected)

      const fromMain = await gh.getActivityWithMember()
      expect(fromMain).toStrictEqual(expected)

      const fromDb = await gh.main()

      expect(fromDb).toBeDefined()
      expect(fromDb.id).toBe(commentCreated.id)
      expect(fromDb.sourceParentId).toBe(discussion.sourceId)
      expect(fromDb.parentId).toBe(discussion.id)
    })
  })

  describe('Previously failing tests', () => {
    it('It should parse events that failed before', async () => {
      for (let i = 0; i < TestEvents.failed.length; i++) {
        const { gh } = await init(TestEvents.failed[i].event, TestEvents.failed[i].payload, true)
        const out = await gh.main()
        expect(out.id).toBeDefined()
        expect(out).toBeDefined()
      }
    })
  })
})
