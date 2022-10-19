/* eslint @typescript-eslint/no-unused-vars: 0 */
/* eslint class-methods-use-this: 0 */
/* eslint prefer-const: 0 */
import moment from 'moment'
import { GITHUB_CONFIG, IS_TEST_ENV } from '../../../config/index'
import { Repo, Repos, Endpoint, Endpoints, State } from '../types/regularTypes'
import { BaseOutput, IntegrationResponse, parseOutput } from '../types/iteratorTypes'
import BaseIterator from './baseIterator'
import StargazersQuery from '../usecases/github/graphql/stargazers'
import IntegrationRepository from '../../../database/repositories/integrationRepository'
import getUserContext from '../../../database/utils/getUserContext'
import { PlatformType } from '../../../utils/platforms'
import { AddActivitiesSingle, Member, IntegrationsMessage } from '../types/messageTypes'
import sendIntegrationsMessage from '../utils/integrationSQS'
import PullRequestsQuery from '../usecases/github/graphql/pullRequests'
import bulkOperations from '../../dbOperations/operationsWorker'
import Operations from '../../dbOperations/operations'
import { GitHubGrid } from '../grid/githubGrid'
import PullRequestCommentsQuery from '../usecases/github/graphql/pullRequestComments'
import getOrganization from '../usecases/github/graphql/organizations'
import IssuesQuery from '../usecases/github/graphql/issues'
import IssueCommentsQuery from '../usecases/github/graphql/issueComments'
import ForksQuery from '../usecases/github/graphql/forks'
import DiscussionsQuery from '../usecases/github/graphql/discussions'
import DiscussionCommentsQuery from '../usecases/github/graphql/discussionComments'
import { GithubActivityType } from '../../../utils/activityTypes'
import Error400 from '../../../errors/Error400'
import { MemberAttributeName } from '../../../database/attributes/member/enums'

export default class GithubIterator extends BaseIterator {
  static limitReachedState: State = {
    endpoints: [],
    endpoint: '__limit',
    page: '__limit',
  }

  static readonly ENDPOINT_MAX_RETRY = 5

  static globalLimit: number = Number(GITHUB_CONFIG.globalLimit || Infinity)

  static fixedEndpoints: Endpoints = ['stargazers', 'forks', 'pulls', 'issues', 'discussions']

  accessToken: string

  repos: Repos

  pullRequests

  issues

  /**
   * Constructor for the Github Iterator
   * @param tenant The tenant we are working on
   * @param repos The list of repos that github app installed on
   * @param accessToken The access token for the github app installation
   * @param state The current state (leave empty for starting)
   */
  constructor(
    tenant: string,
    repos: Repos,
    accessToken: string,
    state: State = { endpoints: [], endpoint: '', page: '' },
    onboarding: boolean = false,
  ) {
    let endpoints: Endpoints
    if (state.endpoints.length === 0) {
      endpoints = repos.reduce((acc, repo) => {
        const repoEndpoints = GithubIterator.fixedEndpoints.map(
          (endpoint) => `${repo.name}|${endpoint}`,
        )
        acc.push(...repoEndpoints)
        return acc
      }, [])
    } else {
      endpoints = state.endpoints
    }

    super(tenant, endpoints, state, onboarding, GithubIterator.globalLimit)
    this.repos = repos
    this.accessToken = accessToken
  }

  /**
   * Gets the data from github graphQL api and returns parsed crowd activites with members.
   * Creates dynamic endpoints for issue comments, pull request comments and discussion comments
   * while processing the parent endpoints.
   * Sleeps 1 second before doing actual work, to get round rate limits.
   * @param endpoint Current endpoint to get and parse
   * @param page Current page to get for the endpoint data
   * @returns an IntegrationResponse object with the returned records and paging info
   */
  async get(endpoint: Endpoint, page: string): Promise<IntegrationResponse> {
    await BaseIterator.sleep(1)

    const splitted = endpoint.split('|')
    const repoName = splitted[0]
    const event = splitted[1]

    let result

    switch (event) {
      case 'stargazers': {
        const stargazersQuery = new StargazersQuery(this.getRepoByName(repoName), this.accessToken)
        result = await stargazersQuery.getSinglePage(page)

        result.data = result.data.filter((i) => (i as any).node?.login)
        break
      }
      case 'pulls': {
        const pullRequestsQuery = new PullRequestsQuery(
          this.getRepoByName(repoName),
          this.accessToken,
        )
        result = await pullRequestsQuery.getSinglePage(page)

        // filter out activities without authors (such as bots)
        result.data = result.data.filter((i) => (i as any).author?.login)

        // add each PR as separate endpoint for comments as form repoName|pull-comments|id
        result.data.map((pr) =>
          this.endpoints.push(`${repoName}|pull-comments|${(pr as any).number}`),
        )

        this.endpointsIterator = BaseIterator.getEndPointsIterator(this.endpoints, this.state)

        break
      }
      case 'pull-comments': {
        const pullRequestNumber = splitted[2]
        const pullRequestCommentsQuery = new PullRequestCommentsQuery(
          this.getRepoByName(repoName),
          pullRequestNumber,
          this.accessToken,
        )

        result = await pullRequestCommentsQuery.getSinglePage(page)

        result.data = result.data.filter((i) => (i as any).author?.login)
        break
      }
      case 'issue-comments': {
        const issueNumber = splitted[2]
        const issueCommentsQuery = new IssueCommentsQuery(
          this.getRepoByName(repoName),
          issueNumber,
          this.accessToken,
        )
        result = await issueCommentsQuery.getSinglePage(page)

        result.data = result.data.filter((i) => (i as any).author?.login)
        break
      }
      case 'issues': {
        const issuesQuery = new IssuesQuery(this.getRepoByName(repoName), this.accessToken)
        result = await issuesQuery.getSinglePage(page)

        // filter out activities without authors (such as bots)
        result.data = result.data.filter((i) => (i as any).author?.login)

        // add each issue as separate endpoint for comments as form repoName|issue-comments|id
        result.data.map((issue) =>
          this.endpoints.push(`${repoName}|issue-comments|${(issue as any).number}`),
        )

        this.endpointsIterator = BaseIterator.getEndPointsIterator(this.endpoints, this.state)

        break
      }
      case 'forks': {
        const forksQuery = new ForksQuery(this.getRepoByName(repoName), this.accessToken)
        result = await forksQuery.getSinglePage(page)

        // filter out activities without authors (such as bots) -- may not the case for forks, but filter out anyways
        result.data = result.data.filter((i) => (i as any).owner?.login)
        break
      }

      case 'discussions': {
        const discussionsQuery = new DiscussionsQuery(
          this.getRepoByName(repoName),
          this.accessToken,
        )
        result = await discussionsQuery.getSinglePage(page)

        result.data = result.data.filter((i) => (i as any).author?.login)

        for (const discussion of result.data) {
          if ((discussion as any).comments.totalCount > 0) {
            this.endpoints.push(`${repoName}|discussion-comments|${(discussion as any).number}`)
          }
        }

        this.endpointsIterator = BaseIterator.getEndPointsIterator(this.endpoints, this.state)
        break
      }

      case 'discussion-comments': {
        const discussionNumber = splitted[2]
        const discussionCommentsQuery = new DiscussionCommentsQuery(
          this.getRepoByName(repoName),
          discussionNumber,
          this.accessToken,
        )
        result = await discussionCommentsQuery.getSinglePage(page)

        result.data = result.data.filter((i) => (i as any).author?.login)
        break
      }

      default: {
        throw new Error(`unsupported event ${event}`)
      }
    }

    return {
      records: result.data,
      nextPage: result.hasPreviousPage ? result.startCursor : '',
      limit: -1,
      timeUntilReset: -1,
    }
  }

  /**
   * Searches given repository name among installed repositories
   * Returns null if given repo is not found.
   * @param name  The tenant we are working on
   * @returns Found repo object
   */
  getRepoByName(name: string): Repo | null {
    for (const currentRepo of this.repos) {
      if (currentRepo.name === name) {
        return currentRepo
      }
    }

    return null
  }

  /**
   * Gets the repository and event from given endpoint.
   * Endpoint is pipe (|) delimeted string of repo|event
   * Throws 400 when fails to split the string.
   * @param endpoint | delimited string with repo and event
   * @returns repo and event as an object
   */
  getSplitEndpointInfo(endpoint: string): any {
    const endpointSplitted = endpoint.split('|')

    if (endpointSplitted.length < 2) {
      throw new Error400('en', 'errors.integrations.badEndpoint', endpoint)
    }

    return { repo: endpointSplitted[0], event: endpointSplitted[1] }
  }

  /**
   * Updates github integration status to 'done'
   */
  async updateStatus(): Promise<void> {
    const userContext = await getUserContext(this.tenant)
    const integration = await IntegrationRepository.findByPlatform(PlatformType.GITHUB, userContext)
    await IntegrationRepository.update(integration.id, { status: 'done' }, userContext)
  }

  /**
   * Limit is never reached because of sleeping state in get function
   */
  isLimitReached(limit: number): boolean {
    return false
  }

  /**
   * We never retrospect in GitHub (because realtime data is created using webhooks)
   * Always returns false
   */
  integrationSpecificIsEndpointFinished(
    endpoint: string,
    lastRecord: any,
    activities: Array<AddActivitiesSingle> = [],
  ): boolean {
    return false
  }

  /**
   * When lambda limit is reached, we send another sqs message with current event
   * @param state Current state we're on
   * @param timeUntilReset Number of seconds we need to wait before firing next step machine
   * @returns
   */
  async limitReachedFunction(state: State, timeUntilReset: number): Promise<BaseOutput> {
    const body: IntegrationsMessage = this.getSQSBody(state, timeUntilReset)
    await sendIntegrationsMessage(body)

    return {
      status: 200,
      msg: 'Limit reached, message sent to SQS',
    }
  }

  /**
   * Gets the sqs message to be sent after limit is reached
   * @param state current state we're on
   * @param timeUntilReset Number of seconds we need to wait before firing next step machine
   * @returns an integration message to send to integrations SQS
   */
  getSQSBody(state: State, timeUntilReset: number): IntegrationsMessage {
    return {
      integration: PlatformType.GITHUB,
      state,
      tenant: this.tenant,
      sleep: timeUntilReset,
      onboarding: this.onboarding,
      args: {},
    }
  }

  /**
   * Parses given list of github activities into crowd activities and saves these to the database.
   * @param records Records to be parsed
   * @param endpoint Current endpoint
   * @returns
   */
  async parseActivitiesAndWrite(records: Array<object>, endpoint: Endpoint): Promise<parseOutput> {
    const parseOutput = await this.parseActivities(records, endpoint)
    await bulkOperations(
      this.tenant,
      Operations.UPSERT_ACTIVITIES_WITH_MEMBERS,
      parseOutput.activities,
    )
    return parseOutput
  }

  /**
   * Parses various activity types into crowd activities.
   * @param records List of activities to be parsed
   * @param endpoint Current endpoint
   * @returns parsed activities that can be saved to the database.
   */
  async parseActivities(records: Array<object>, endpoint: Endpoint): Promise<parseOutput> {
    let activities: Array<AddActivitiesSingle>
    const { event } = this.getSplitEndpointInfo(endpoint)

    switch (event) {
      case 'pulls':
        activities = await this.parsePullRequests(records, endpoint)
        break

      case 'issues':
        activities = await this.parseIssues(records, endpoint)
        break

      case 'forks':
        activities = await this.parseForks(records, endpoint)
        break

      case 'stargazers':
        activities = await this.parseStars(records, endpoint)
        break

      case 'pull-comments':
        activities = await this.parsePullRequestComments(records, endpoint)
        break

      case 'issue-comments':
        activities = await this.parseIssueComments(records, endpoint)
        break

      case 'discussions':
        activities = await this.parseDiscussions(records, endpoint)
        break

      case 'discussion-comments':
        activities = await this.parseDiscussionComments(records, endpoint)
        break

      default:
        console.log('not supported event')
        activities = []
    }

    if (activities.length > 0) {
      return {
        activities,
        lastRecord: activities[activities.length - 1],
        numberOfRecords: activities.length,
      }
    }
    return {
      activities,
      lastRecord: {},
      numberOfRecords: 0,
    }
  }

  /**
   * Parses discussions into crowd activities.
   * @param records List of discussion started activities to be parsed
   * @param endpoint Current endpoint
   * @returns parsed discussion activities that can be saved to the database.
   */
  parseDiscussions(records: Array<any>, endpoint: string): Array<AddActivitiesSingle> {
    const { tenant } = this
    const { repo } = this.getSplitEndpointInfo(endpoint)

    return records.reduce(async (acc, record) => {
      acc.push({
        tenant,
        platform: PlatformType.GITHUB,
        type: GithubActivityType.DISCUSSION_STARTED,
        sourceId: record.id,
        sourceParentId: '',
        timestamp: moment(record.createdAt).utc().toDate(),
        body: record.bodyText,
        url: record.url ? record.url : '',
        channel: this.getRepoByName(repo).url,
        title: record.title,
        attributes: {
          category: {
            id: record.category.id,
            isAnswerable: record.category.isAnswerable,
            name: record.category.name,
            slug: record.category.slug,
            emoji: record.category.emoji,
            description: record.category.description,
          },
        },
        member: await this.parseMember(record.author),
        score: GitHubGrid.discussionOpened.score,
        isKeyAction: GitHubGrid.discussionOpened.isKeyAction,
      })

      return acc
    }, [])
  }

  /**
   * Parses issues into crowd activities.
   * @param records List of issues started activities to be parsed
   * @param endpoint Current endpoint
   * @returns parsed issue activities that can be saved to the database.
   */
  async parseIssues(records: Array<any>, endpoint: string): Promise<Array<AddActivitiesSingle>> {
    const { tenant } = this
    const { repo } = this.getSplitEndpointInfo(endpoint)

    return records.reduce(async (acc, record) => {
      acc.push({
        tenant,
        platform: PlatformType.GITHUB,
        type: GithubActivityType.ISSUE_OPENED,
        sourceId: record.id,
        sourceParentId: '',
        timestamp: moment(record.createdAt).utc().toDate(),
        body: record.bodyText,
        url: record.url ? record.url : '',
        channel: this.getRepoByName(repo).url,
        title: record.title.replace(/\0/g, ''),
        attributes: {
          state: record.state.toLowerCase(),
        },
        member: await this.parseMember(record.author),
        score: GitHubGrid.issueOpened.score,
        isKeyAction: GitHubGrid.issueOpened.isKeyAction,
      })

      return acc
    }, [])
  }

  /**
   * Parses forks into crowd activities.
   * @param records List of fork activities to be parsed
   * @param endpoint Current endpoint
   * @returns parsed fork activities that can be saved to the database.
   */
  async parseForks(records: Array<any>, endpoint: string): Promise<Array<AddActivitiesSingle>> {
    const { tenant } = this
    const { repo } = this.getSplitEndpointInfo(endpoint)

    return records.reduce(async (acc, record) => {
      acc.push({
        tenant,
        platform: PlatformType.GITHUB,
        type: GithubActivityType.FORK,
        sourceId: record.id,
        sourceParentId: '',
        timestamp: moment(record.createdAt).utc().toDate(),
        channel: this.getRepoByName(repo).url,
        member: await this.parseMember(record.owner),
        score: GitHubGrid.fork.score,
        isKeyAction: GitHubGrid.fork.isKeyAction,
      })

      return acc
    }, [])
  }

  /**
   * Parses pull requests into crowd activities.
   * Current pull request state is saved into attributes.state
   * @param records List of pull request created activities to be parsed
   * @param endpoint Current endpoint
   * @returns parsed fork activities that can be saved to the database.
   */
  async parsePullRequests(
    records: Array<any>,
    endpoint: string,
  ): Promise<Array<AddActivitiesSingle>> {
    const { tenant } = this
    const { repo } = this.getSplitEndpointInfo(endpoint)

    return records.reduce(async (acc, record) => {
      acc.push({
        tenant,
        platform: PlatformType.GITHUB,
        type: GithubActivityType.PULL_REQUEST_OPENED,
        sourceId: record.id,
        sourceParentId: '',
        timestamp: moment(record.createdAt).utc().toDate(),
        body: record.bodyText,
        url: record.url ? record.url : '',
        channel: this.getRepoByName(repo).url,
        title: record.title,
        attributes: {
          state: record.state.toLowerCase(),
        },
        member: await this.parseMember(record.author),
        score: GitHubGrid.pullRequestOpened.score,
        isKeyAction: GitHubGrid.pullRequestOpened.isKeyAction,
      })

      return acc
    }, [])
  }

  /**
   * Parses discussion comments into crowd activities.
   * Discussion comment type activities will have the discussion created activity as the parent.
   * Also parses the replies to these comments. These replies will have
   * their parent as the main comment.
   * @param records List of discussion comment activities to be parsed
   * @param endpoint Current endpoint
   * @returns parsed discussion comment activities that can be saved to the database.
   */
  async parseDiscussionComments(
    records: Array<any>,
    endpoint: string,
  ): Promise<Array<AddActivitiesSingle>> {
    const { tenant } = this
    const { repo } = this.getSplitEndpointInfo(endpoint)

    return records.reduce(async (acc, record) => {
      const commentId = record.id

      acc.push({
        tenant,
        platform: PlatformType.GITHUB,
        type: GithubActivityType.DISCUSSION_COMMENT,
        sourceId: commentId,
        sourceParentId: record.discussion.id,
        timestamp: moment(record.createdAt).utc().toDate(),
        url: record.url,
        body: record.bodyText,
        channel: this.getRepoByName(repo).url,
        attributes: {
          isAnswer: record.isAnswer ?? undefined,
        },
        member: await this.parseMember(record.author),
        score: record.isAnswer ? GitHubGrid.selectedAnswer.score : GitHubGrid.comment.score,
        isKeyAction: record.isAnswer
          ? GitHubGrid.selectedAnswer.isKeyAction
          : GitHubGrid.comment.isKeyAction,
      })

      const replies = []
      for (const reply of record.replies.nodes) {
        const member = await this.parseMember(reply.author)
        replies.push({
          tenant,
          platform: PlatformType.GITHUB,
          type: GithubActivityType.DISCUSSION_COMMENT,
          sourceId: reply.id,
          sourceParentId: commentId,
          timestamp: moment(reply.createdAt).utc().toDate(),
          url: reply.url,
          body: reply.bodyText,
          channel: this.getRepoByName(repo).url,
          member,
          score: GitHubGrid.comment.score,
          isKeyAction: GitHubGrid.comment.isKeyAction,
        })
      }

      acc = acc.concat(replies)

      return acc
    }, [])
  }

  /**
   * Parses issue comments into crowd activities.
   * These activities parents' will be the issue created activity.
   * @param records List of issue comment activities to be parsed
   * @param endpoint Current endpoint
   * @returns parsed issue comment activities that can be saved to the database.
   */
  async parseIssueComments(
    records: Array<any>,
    endpoint: string,
  ): Promise<Array<AddActivitiesSingle>> {
    const { tenant } = this
    const { repo } = this.getSplitEndpointInfo(endpoint)

    return records.reduce(async (acc, record) => {
      acc.push({
        tenant,
        platform: PlatformType.GITHUB,
        type: GithubActivityType.ISSUE_COMMENT,
        sourceId: record.id,
        sourceParentId: record.issue.id,
        timestamp: moment(record.createdAt).utc().toDate(),
        url: record.url,
        body: record.bodyText,
        channel: this.getRepoByName(repo).url,
        member: await this.parseMember(record.author),
        score: GitHubGrid.comment.score,
        isKeyAction: GitHubGrid.comment.isKeyAction,
      })

      return acc
    }, [])
  }

  /**
   * Parses pull request comments into crowd activities.
   * These activities parents' will be the pull request opened activity.
   * @param records List of pull request comment activities to be parsed
   * @param endpoint Current endpoint
   * @returns parsed pull request comment activities that can be saved to the database.
   */
  async parsePullRequestComments(
    records: Array<any>,
    endpoint: string,
  ): Promise<Array<AddActivitiesSingle>> {
    const { tenant } = this
    const { repo } = this.getSplitEndpointInfo(endpoint)

    return records.reduce(async (acc, record) => {
      acc.push({
        tenant,
        platform: PlatformType.GITHUB,
        type: GithubActivityType.PULL_REQUEST_COMMENT,
        sourceId: record.id,
        sourceParentId: record.pullRequest.id,
        timestamp: moment(record.createdAt).utc().toDate(),
        url: record.url,
        body: record.bodyText,
        channel: this.getRepoByName(repo).url,
        member: await this.parseMember(record.author),
        score: GitHubGrid.comment.score,
        isKeyAction: GitHubGrid.comment.isKeyAction,
      })

      return acc
    }, [])
  }

  /**
   * Parses stars into crowd activities.
   * @param records List of stars created activities to be parsed
   * @param endpoint Current endpoint
   * @returns parsed star activities that can be saved to the database.
   */
  async parseStars(records: Array<any>, endpoint: string): Promise<Array<AddActivitiesSingle>> {
    const { tenant } = this
    const { repo } = this.getSplitEndpointInfo(endpoint)

    const out = []
    for (const record of records) {
      out.push({
        tenant,
        platform: PlatformType.GITHUB,
        type: GithubActivityType.STAR,
        sourceId: BaseIterator.generateSourceIdHash(
          record.node.login,
          GithubActivityType.STAR,
          moment(record.starredAt).utc().toDate().toString(),
          PlatformType.GITHUB,
        ),
        sourceParentId: '',
        timestamp: moment(record.starredAt).utc().toDate(),
        channel: this.getRepoByName(repo).url,
        member: await this.parseMember(record.node),
        score: GitHubGrid.star.score,
        isKeyAction: GitHubGrid.star.isKeyAction,
      })
    }
    return out
  }

  /**
   * Parses members into crowd members.
   * @param memberFromApi member object returned from the github graphQL api
   * @returns parsed members that can be saved to the database.
   */
  async parseMember(memberFromApi: any): Promise<Member> {
    const member: Member = {
      username: { [PlatformType.GITHUB]: memberFromApi.login },
      displayName: memberFromApi.name,
      attributes: {
        [MemberAttributeName.NAME]: {
          [PlatformType.GITHUB]: memberFromApi.name,
        },
        [MemberAttributeName.IS_HIREABLE]: {
          [PlatformType.GITHUB]: memberFromApi.isHireable || false,
        },
        [MemberAttributeName.URL]: {
          [PlatformType.GITHUB]: memberFromApi.url,
        },
        [MemberAttributeName.BIO]: {
          [PlatformType.GITHUB]: memberFromApi.bio || '',
        },
        [MemberAttributeName.LOCATION]: {
          [PlatformType.GITHUB]: memberFromApi.location || '',
        },
      },
      email: memberFromApi.email || '',
    }

    if (memberFromApi.company) {
      if (IS_TEST_ENV) {
        member.organizations = [{ name: 'crowd.dev' }]
      } else {
        const company = memberFromApi.company.replace('@', '').trim()
        const fromAPI = await getOrganization(company, this.accessToken)
        if (fromAPI) {
          member.organizations = [
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
          member.organizations = [{ name: company }]
        }
      }
    }

    if (memberFromApi.twitterUsername) {
      member.attributes[MemberAttributeName.URL][
        PlatformType.TWITTER
      ] = `https://twitter.com/${memberFromApi.twitterUsername}`
      member.username[PlatformType.TWITTER] = memberFromApi.twitterUsername
    }

    return member
  }
}
