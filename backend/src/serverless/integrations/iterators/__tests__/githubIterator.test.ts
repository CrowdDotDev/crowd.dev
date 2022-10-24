import moment from 'moment'

import { IRepositoryOptions } from '../../../../database/repositories/IRepositoryOptions'
import SequelizeTestUtils from '../../../../database/utils/sequelizeTestUtils'
import { Repos } from '../../types/regularTypes'
import GithubIterator from '../githubIterator'
import IntegrationService from '../../../../services/integrationService'
import { PlatformType } from '../../../../utils/platforms'
import Error400 from '../../../../errors/Error400'
import {
  mockPullRequests,
  mockIssues,
  mockForks,
  mockStars,
  mockPullRequestComments,
  mockIssueComments,
  mockDiscussions,
  mockDiscussionComments,
} from './githubGraphqlMockResponses'
import { GithubActivityType } from '../../../../utils/activityTypes'
import { GitHubGrid } from '../../grid/githubGrid'
import BaseIterator from '../baseIterator'
import { MemberAttributeName } from '../../../../database/attributes/member/enums'

const db = null

async function getGithubIterator(repos: Repos, options: IRepositoryOptions) {
  const integrationService = new IntegrationService(options)
  await integrationService.createOrUpdate({
    platform: PlatformType.GITHUB,
    token: 'token',
    settings: {},
  })

  return new GithubIterator(
    options.currentTenant.id,
    repos,
    'token',
    {
      endpoint: '',
      page: '',
      endpoints: [],
    },
    true,
  )
}

function getRepos(): Repos {
  return [
    {
      url: 'repo-1-url',
      name: 'repo 1',
      createdAt: '2022-02-09T10:42:41Z',
      owner: 'CrowdDotDev',
    },
    {
      url: 'repo-2-url',
      name: 'repo 2',
      createdAt: '2022-07-09T12:42:45Z',
      owner: 'CrowdDotDev',
    },
  ]
}

describe('Github iterator tests', () => {
  beforeEach(async () => {
    await SequelizeTestUtils.wipeDatabase(db)
  })

  afterAll(() => {
    SequelizeTestUtils.closeConnection(db)
  })

  describe('Init tests', () => {
    it('It should initialize fixed endpoints', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      const repos: Repos = getRepos()

      const ghi = await getGithubIterator(repos, mockIRepositoryOptions)
      expect(ghi.endpoints).toStrictEqual([
        `${repos[0].name}|stargazers`,
        `${repos[0].name}|forks`,
        `${repos[0].name}|pulls`,
        `${repos[0].name}|issues`,
        `${repos[0].name}|discussions`,
        `${repos[1].name}|stargazers`,
        `${repos[1].name}|forks`,
        `${repos[1].name}|pulls`,
        `${repos[1].name}|issues`,
        `${repos[1].name}|discussions`,
      ])
    })
  })

  describe('Get repo by name tests', () => {
    it('It should get the repo object searching by name, null when not found', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      const repos: Repos = getRepos()
      const ghi = await getGithubIterator(repos, mockIRepositoryOptions)

      const repo1 = ghi.getRepoByName(repos[0].name)
      expect(repo1).toStrictEqual(repos[0])

      const repo2 = ghi.getRepoByName(repos[1].name)
      expect(repo2).toStrictEqual(repos[1])

      expect(ghi.getRepoByName('non existent name')).toBeNull()
    })
  })

  describe('getSplitEndpointInfo tests', () => {
    it('It should return the repo and event from a "|" concatenated string, throws 400 when a split is not possible', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      const repos: Repos = getRepos()
      const ghi = await getGithubIterator(repos, mockIRepositoryOptions)

      const { repo, event } = ghi.getSplitEndpointInfo(`${repos[0].name}|stargazers`)

      expect(repo).toBe(repos[0].name)
      expect(event).toBe('stargazers')

      await expect(() => ghi.getSplitEndpointInfo('malformed-endpoint')).toThrowError(
        new Error400('en', 'errors.integrations.badEndpoint', 'malformed-endpoint'),
      )
    })
  })
  describe('parseMembers tests', () => {
    it('It should parse a member coming from graphql api', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      const repos: Repos = getRepos()
      const ghi = await getGithubIterator(repos, mockIRepositoryOptions)

      const prWithMember = mockPullRequests.data.repository.pullRequests.nodes[4].author
      const memberParsed = await ghi.parseMember(prWithMember)

      expect(memberParsed).toStrictEqual({
        username: {
          [PlatformType.GITHUB]: prWithMember.login,
          [PlatformType.TWITTER]: prWithMember.twitterUsername,
        },
        displayName: prWithMember.name,
        attributes: {
          [MemberAttributeName.NAME]: {
            [PlatformType.GITHUB]: prWithMember.name,
          },
          [MemberAttributeName.IS_HIREABLE]: {
            [PlatformType.GITHUB]: prWithMember.isHireable,
          },
          [MemberAttributeName.URL]: {
            [PlatformType.GITHUB]: prWithMember.url,
            [PlatformType.TWITTER]: `https://twitter.com/${prWithMember.twitterUsername}`,
          },
          [MemberAttributeName.BIO]: {
            [PlatformType.GITHUB]: prWithMember.bio,
          },
          [MemberAttributeName.AVATAR_URL]: { [PlatformType.GITHUB]: '' },
          [MemberAttributeName.LOCATION]: {
            [PlatformType.GITHUB]: prWithMember.location,
          },
        },
        email: prWithMember.email,
        organizations: [
          {
            name: 'crowd.dev',
          },
        ],
      })
    })
  })

  describe('parseActivities tests', () => {
    it('It should parse pull requests coming from graphql api', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      const repos: Repos = getRepos()
      const ghi = await getGithubIterator(repos, mockIRepositoryOptions)

      const singlePr = mockPullRequests.data.repository.pullRequests.nodes[4]

      const prsParsed = await ghi.parseActivities(
        mockPullRequests.data.repository.pullRequests.nodes.slice(4),
        `${repos[0].name}|pulls`,
      )

      expect(prsParsed.activities).toStrictEqual([
        {
          tenant: mockIRepositoryOptions.currentTenant.id,
          platform: PlatformType.GITHUB,
          type: GithubActivityType.PULL_REQUEST_OPENED,
          sourceId: singlePr.id,
          sourceParentId: '',
          timestamp: moment(singlePr.createdAt).utc().toDate(),
          body: singlePr.bodyText,
          url: singlePr.url,
          channel: repos[0].url,
          title: singlePr.title,
          attributes: {
            state: singlePr.state.toLowerCase(),
          },
          member: await ghi.parseMember(singlePr.author),
          score: GitHubGrid.pullRequestOpened.score,
          isKeyAction: GitHubGrid.pullRequestOpened.isKeyAction,
        },
      ])

      expect(prsParsed.lastRecord).toBe(prsParsed.activities[prsParsed.activities.length - 1])
      expect(prsParsed.numberOfRecords).toBe(1)
    })
  })

  it('It should parse issues coming from graphql api', async () => {
    const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
    const repos: Repos = getRepos()
    const ghi = await getGithubIterator(repos, mockIRepositoryOptions)

    const singleIssue = mockIssues.data.repository.issues.nodes[0]

    const issuesParsed = await ghi.parseActivities(
      mockIssues.data.repository.issues.nodes.slice(0, 1),
      `${repos[0].name}|issues`,
    )

    expect(issuesParsed.activities).toStrictEqual([
      {
        tenant: mockIRepositoryOptions.currentTenant.id,
        platform: PlatformType.GITHUB,
        type: GithubActivityType.ISSUE_OPENED,
        sourceId: singleIssue.id,
        sourceParentId: '',
        timestamp: moment(singleIssue.createdAt).utc().toDate(),
        body: singleIssue.bodyText,
        url: singleIssue.url,
        channel: repos[0].url,
        title: singleIssue.title,
        attributes: {
          state: singleIssue.state.toLowerCase(),
        },
        member: await ghi.parseMember(singleIssue.author),
        score: GitHubGrid.issueOpened.score,
        isKeyAction: GitHubGrid.issueOpened.isKeyAction,
      },
    ])

    expect(issuesParsed.lastRecord).toBe(
      issuesParsed.activities[issuesParsed.activities.length - 1],
    )
    expect(issuesParsed.numberOfRecords).toBe(1)
  })

  it('It should parse forks coming from graphql api', async () => {
    const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
    const repos: Repos = getRepos()
    const ghi = await getGithubIterator(repos, mockIRepositoryOptions)

    const singleFork = mockForks.data.repository.forks.nodes[0]

    const forksParsed = await ghi.parseActivities(
      mockForks.data.repository.forks.nodes.slice(0, 1),
      `${repos[0].name}|forks`,
    )

    expect(forksParsed.activities).toStrictEqual([
      {
        tenant: mockIRepositoryOptions.currentTenant.id,
        platform: PlatformType.GITHUB,
        type: GithubActivityType.FORK,
        sourceId: singleFork.id,
        sourceParentId: '',
        timestamp: moment(singleFork.createdAt).utc().toDate(),
        channel: repos[0].url,
        member: await ghi.parseMember(singleFork.owner),
        score: GitHubGrid.fork.score,
        isKeyAction: GitHubGrid.fork.isKeyAction,
      },
    ])

    expect(forksParsed.lastRecord).toBe(forksParsed.activities[forksParsed.activities.length - 1])
    expect(forksParsed.numberOfRecords).toBe(1)
  })

  it('It should parse stars coming from graphql api', async () => {
    const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
    const repos: Repos = getRepos()
    const ghi = await getGithubIterator(repos, mockIRepositoryOptions)

    const singleStar = mockStars.data.repository.stargazers.edges[0]

    const starsParsed = await ghi.parseActivities(
      mockStars.data.repository.stargazers.edges.slice(0, 1),
      `${repos[0].name}|stargazers`,
    )

    expect(starsParsed.activities).toStrictEqual([
      {
        tenant: mockIRepositoryOptions.currentTenant.id,
        platform: PlatformType.GITHUB,
        type: GithubActivityType.STAR,
        sourceId: BaseIterator.generateSourceIdHash(
          singleStar.node.login,
          GithubActivityType.STAR,
          moment(singleStar.starredAt).utc().toDate().toString(),
          PlatformType.GITHUB,
        ),
        sourceParentId: '',
        timestamp: moment(singleStar.starredAt).utc().toDate(),
        channel: repos[0].url,
        member: await ghi.parseMember(singleStar.node),
        score: GitHubGrid.star.score,
        isKeyAction: GitHubGrid.star.isKeyAction,
      },
    ])

    expect(starsParsed.lastRecord).toBe(starsParsed.activities[starsParsed.activities.length - 1])
    expect(starsParsed.numberOfRecords).toBe(1)
  })

  it('It should parse pull request comments coming from graphql api', async () => {
    const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
    const repos: Repos = getRepos()
    const ghi = await getGithubIterator(repos, mockIRepositoryOptions)

    const singlePullRequestComment =
      mockPullRequestComments.data.repository.pullRequest.comments.nodes[0]

    const pullRequestCommentsParsed = await ghi.parseActivities(
      mockPullRequestComments.data.repository.pullRequest.comments.nodes.slice(0, 1),
      `${repos[0].name}|pull-comments`,
    )

    expect(pullRequestCommentsParsed.activities).toStrictEqual([
      {
        tenant: mockIRepositoryOptions.currentTenant.id,
        platform: PlatformType.GITHUB,
        type: GithubActivityType.PULL_REQUEST_COMMENT,
        sourceId: singlePullRequestComment.id,
        sourceParentId: singlePullRequestComment.pullRequest.id,
        timestamp: moment(singlePullRequestComment.createdAt).utc().toDate(),
        url: singlePullRequestComment.url,
        body: singlePullRequestComment.bodyText,
        channel: repos[0].url,
        member: await ghi.parseMember(singlePullRequestComment.author),
        score: GitHubGrid.comment.score,
        isKeyAction: GitHubGrid.comment.isKeyAction,
      },
    ])

    expect(pullRequestCommentsParsed.lastRecord).toBe(
      pullRequestCommentsParsed.activities[pullRequestCommentsParsed.activities.length - 1],
    )
    expect(pullRequestCommentsParsed.numberOfRecords).toBe(1)
  })

  it('It should parse issue comments coming from graphql api', async () => {
    const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
    const repos: Repos = getRepos()
    const ghi = await getGithubIterator(repos, mockIRepositoryOptions)

    const singleIssueComment = mockIssueComments.data.repository.issue.comments.nodes[0]

    const issueCommentsParsed = await ghi.parseActivities(
      mockIssueComments.data.repository.issue.comments.nodes.slice(0, 1),
      `${repos[0].name}|issue-comments`,
    )

    expect(issueCommentsParsed.activities).toStrictEqual([
      {
        tenant: mockIRepositoryOptions.currentTenant.id,
        platform: PlatformType.GITHUB,
        type: GithubActivityType.ISSUE_COMMENT,
        sourceId: singleIssueComment.id,
        sourceParentId: singleIssueComment.issue.id,
        timestamp: moment(singleIssueComment.createdAt).utc().toDate(),
        url: singleIssueComment.url,
        body: singleIssueComment.bodyText,
        channel: repos[0].url,
        member: await ghi.parseMember(singleIssueComment.author),
        score: GitHubGrid.comment.score,
        isKeyAction: GitHubGrid.comment.isKeyAction,
      },
    ])

    expect(issueCommentsParsed.lastRecord).toBe(
      issueCommentsParsed.activities[issueCommentsParsed.activities.length - 1],
    )
    expect(issueCommentsParsed.numberOfRecords).toBe(1)
  })

  it('It should parse discussions coming from graphql api', async () => {
    const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
    const repos: Repos = getRepos()
    const ghi = await getGithubIterator(repos, mockIRepositoryOptions)

    const singleDiscussion = mockDiscussions.data.repository.discussions.nodes[0]

    const discussionsParsed = await ghi.parseActivities(
      mockDiscussions.data.repository.discussions.nodes.slice(0, 1),
      `${repos[0].name}|discussions`,
    )

    expect(discussionsParsed.activities).toStrictEqual([
      {
        tenant: mockIRepositoryOptions.currentTenant.id,
        platform: PlatformType.GITHUB,
        type: GithubActivityType.DISCUSSION_STARTED,
        sourceId: singleDiscussion.id,
        sourceParentId: '',
        timestamp: moment(singleDiscussion.createdAt).utc().toDate(),
        body: singleDiscussion.bodyText,
        url: singleDiscussion.url,
        channel: repos[0].url,
        title: singleDiscussion.title,
        attributes: {
          category: {
            id: singleDiscussion.category.id,
            isAnswerable: singleDiscussion.category.isAnswerable,
            name: singleDiscussion.category.name,
            slug: singleDiscussion.category.slug,
            emoji: singleDiscussion.category.emoji,
            description: singleDiscussion.category.description,
          },
        },
        member: await ghi.parseMember(singleDiscussion.author),
        score: GitHubGrid.discussionOpened.score,
        isKeyAction: GitHubGrid.discussionOpened.isKeyAction,
      },
    ])

    expect(discussionsParsed.lastRecord).toBe(
      discussionsParsed.activities[discussionsParsed.activities.length - 1],
    )
    expect(discussionsParsed.numberOfRecords).toBe(1)
  })

  it('It should parse discussions comments coming from graphql api', async () => {
    const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
    const repos: Repos = getRepos()
    const ghi = await getGithubIterator(repos, mockIRepositoryOptions)

    const singleDiscussionComment =
      mockDiscussionComments.data.repository.discussion.comments.nodes[0]

    const discussionCommentsParsed = await ghi.parseActivities(
      mockDiscussionComments.data.repository.discussion.comments.nodes.slice(0, 1),
      `${repos[0].name}|discussion-comments`,
    )

    const expectedParsedOutput = [
      {
        tenant: mockIRepositoryOptions.currentTenant.id,
        platform: PlatformType.GITHUB,
        type: GithubActivityType.DISCUSSION_COMMENT,
        sourceId: singleDiscussionComment.id,
        sourceParentId: singleDiscussionComment.discussion.id,
        timestamp: moment(singleDiscussionComment.createdAt).utc().toDate(),
        url: singleDiscussionComment.url,
        body: singleDiscussionComment.bodyText,
        channel: repos[0].url,
        attributes: {
          isAnswer: singleDiscussionComment.isAnswer,
        },
        member: await ghi.parseMember(singleDiscussionComment.author),
        score: GitHubGrid.selectedAnswer.score,
        isKeyAction: GitHubGrid.selectedAnswer.isKeyAction,
      },
      {
        tenant: mockIRepositoryOptions.currentTenant.id,
        platform: PlatformType.GITHUB,
        type: GithubActivityType.DISCUSSION_COMMENT,
        sourceId: singleDiscussionComment.replies.nodes[0].id,
        sourceParentId: singleDiscussionComment.id,
        timestamp: moment(singleDiscussionComment.replies.nodes[0].createdAt).utc().toDate(),
        url: singleDiscussionComment.replies.nodes[0].url,
        body: singleDiscussionComment.replies.nodes[0].bodyText,
        channel: repos[0].url,
        member: await ghi.parseMember(singleDiscussionComment.replies.nodes[0].author),
        score: GitHubGrid.comment.score,
        isKeyAction: GitHubGrid.comment.isKeyAction,
      },
      {
        tenant: mockIRepositoryOptions.currentTenant.id,
        platform: PlatformType.GITHUB,
        type: GithubActivityType.DISCUSSION_COMMENT,
        sourceId: singleDiscussionComment.replies.nodes[1].id,
        sourceParentId: singleDiscussionComment.id,
        timestamp: moment(singleDiscussionComment.replies.nodes[1].createdAt).utc().toDate(),
        url: singleDiscussionComment.replies.nodes[1].url,
        body: singleDiscussionComment.replies.nodes[1].bodyText,
        channel: repos[0].url,
        member: await ghi.parseMember(singleDiscussionComment.replies.nodes[1].author),
        score: GitHubGrid.comment.score,
        isKeyAction: GitHubGrid.comment.isKeyAction,
      },
      {
        tenant: mockIRepositoryOptions.currentTenant.id,
        platform: PlatformType.GITHUB,
        type: GithubActivityType.DISCUSSION_COMMENT,
        sourceId: singleDiscussionComment.replies.nodes[2].id,
        sourceParentId: singleDiscussionComment.id,
        timestamp: moment(singleDiscussionComment.replies.nodes[2].createdAt).utc().toDate(),
        url: singleDiscussionComment.replies.nodes[2].url,
        body: singleDiscussionComment.replies.nodes[2].bodyText,
        channel: repos[0].url,
        member: await ghi.parseMember(singleDiscussionComment.replies.nodes[2].author),
        score: GitHubGrid.comment.score,
        isKeyAction: GitHubGrid.comment.isKeyAction,
      },
      {
        tenant: mockIRepositoryOptions.currentTenant.id,
        platform: PlatformType.GITHUB,
        type: GithubActivityType.DISCUSSION_COMMENT,
        sourceId: singleDiscussionComment.replies.nodes[3].id,
        sourceParentId: singleDiscussionComment.id,
        timestamp: moment(singleDiscussionComment.replies.nodes[3].createdAt).utc().toDate(),
        url: singleDiscussionComment.replies.nodes[3].url,
        body: singleDiscussionComment.replies.nodes[3].bodyText,
        channel: repos[0].url,
        member: await ghi.parseMember(singleDiscussionComment.replies.nodes[3].author),
        score: GitHubGrid.comment.score,
        isKeyAction: GitHubGrid.comment.isKeyAction,
      },
      {
        tenant: mockIRepositoryOptions.currentTenant.id,
        platform: PlatformType.GITHUB,
        type: GithubActivityType.DISCUSSION_COMMENT,
        sourceId: singleDiscussionComment.replies.nodes[4].id,
        sourceParentId: singleDiscussionComment.id,
        timestamp: moment(singleDiscussionComment.replies.nodes[4].createdAt).utc().toDate(),
        url: singleDiscussionComment.replies.nodes[4].url,
        body: singleDiscussionComment.replies.nodes[4].bodyText,
        channel: repos[0].url,
        member: await ghi.parseMember(singleDiscussionComment.replies.nodes[4].author),
        score: GitHubGrid.comment.score,
        isKeyAction: GitHubGrid.comment.isKeyAction,
      },
      {
        tenant: mockIRepositoryOptions.currentTenant.id,
        platform: PlatformType.GITHUB,
        type: GithubActivityType.DISCUSSION_COMMENT,
        sourceId: singleDiscussionComment.replies.nodes[5].id,
        sourceParentId: singleDiscussionComment.id,
        timestamp: moment(singleDiscussionComment.replies.nodes[5].createdAt).utc().toDate(),
        url: singleDiscussionComment.replies.nodes[5].url,
        body: singleDiscussionComment.replies.nodes[5].bodyText,
        channel: repos[0].url,
        member: await ghi.parseMember(singleDiscussionComment.replies.nodes[5].author),
        score: GitHubGrid.comment.score,
        isKeyAction: GitHubGrid.comment.isKeyAction,
      },
      {
        tenant: mockIRepositoryOptions.currentTenant.id,
        platform: PlatformType.GITHUB,
        type: GithubActivityType.DISCUSSION_COMMENT,
        sourceId: singleDiscussionComment.replies.nodes[6].id,
        sourceParentId: singleDiscussionComment.id,
        timestamp: moment(singleDiscussionComment.replies.nodes[6].createdAt).utc().toDate(),
        url: singleDiscussionComment.replies.nodes[6].url,
        body: singleDiscussionComment.replies.nodes[6].bodyText,
        channel: repos[0].url,
        member: await ghi.parseMember(singleDiscussionComment.replies.nodes[6].author),
        score: GitHubGrid.comment.score,
        isKeyAction: GitHubGrid.comment.isKeyAction,
      },
    ]

    expect(discussionCommentsParsed.activities).toStrictEqual(expectedParsedOutput)

    expect(discussionCommentsParsed.lastRecord).toBe(
      discussionCommentsParsed.activities[discussionCommentsParsed.activities.length - 1],
    )
    expect(discussionCommentsParsed.numberOfRecords).toBe(8)
  })
})
