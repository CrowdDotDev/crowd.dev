import sanitizeHtml from 'sanitize-html'
import he from 'he'
import { StackOverflowActivityType, STACKOVERFLOW_GRID } from '@crowd/integrations'
import { getRedisClient, RedisCache } from '@crowd/redis'
import { REDIS_CONFIG } from 'conf'
import {
  IStepContext,
  IIntegrationStream,
  IProcessStreamResults,
  IPendingStream,
} from '../../../../types/integration/stepResult'
import { IntegrationType, PlatformType } from '../../../../types/integrationEnums'
import { IntegrationServiceBase } from '../integrationServiceBase'
import {
  StackOverflowAnswer,
  StackOverflowAnswerResponse,
  StackOverflowQuestionsResponse,
  StackOverflowShallowQuestion,
} from '../../types/stackOverflowTypes'
import getQuestionsByTags from '../../usecases/stackoverflow/getQuestions'
import getQuestionsByKeyword from '../../usecases/stackoverflow/getQuestionsByKeyword'
import getAnswers from '../../usecases/stackoverflow/getAnswers'
import Operations from '../../../dbOperations/operations'
import { AddActivitiesSingle, Member, PlatformIdentities } from '../../types/messageTypes'
import getUser from '../../usecases/stackoverflow/getUser'
import MemberAttributeSettingsService from '../../../../services/memberAttributeSettingsService'
import { StackOverflowMemberAttributes } from '../../../../database/attributes/member/stackOverflow'
import { MemberAttributeName } from '../../../../database/attributes/member/enums'

/* eslint class-methods-use-this: 0 */

/* eslint-disable @typescript-eslint/no-unused-vars */

export class StackOverlflowIntegrationService extends IntegrationServiceBase {
  static maxRetrospect: number = 3 * 3600

  constructor() {
    super(IntegrationType.STACKOVERFLOW, 60)
  }

  async createMemberAttributes(context: IStepContext): Promise<void> {
    const service = new MemberAttributeSettingsService(context.repoContext)
    await service.createPredefined(StackOverflowMemberAttributes)
  }

  /**
   * Set up the pipeline data that will be needed throughout the processing.
   * @param context context passed along worker messages
   */
  async preprocess(context: IStepContext): Promise<void> {
    const settings = context.integration.settings
    const redis = await getRedisClient(REDIS_CONFIG, true)
    const membersCache = new RedisCache('stackoverflow-members', redis, context.logger)
    context.pipelineData = {
      tags: settings.tags,
      keywords: settings.keywords,
      nangoId: `${context.integration.tenantId}-${PlatformType.STACKOVERFLOW}`,
      membersCache,
    }
  }

  /**
   * Get the streams to process. In this case, we need one initial stream per set of tags.
   * @param context context passed along worker messages
   * @returns an array of streams to process
   */
  async getStreams(context: IStepContext): Promise<IPendingStream[]> {
    const tagStreams = context.pipelineData.tags.map((tag: string) => ({
      value: `questions_by_tag:${tag}`,
      metadata: {
        tags: [tag],
        page: 1,
      },
    }))

    const keywordStreams = context.pipelineData.keywords.map((keyword: string) => ({
      value: `questions_by_keyword:${keyword}`,
      metadata: {
        keyword,
        page: 1,
      },
    }))

    return [...tagStreams, ...keywordStreams]
  }

  /**
   * Process a stream. It detects the type of stream we have and call the appropiate function
   * @param stream the full stream information
   * @param context context passed along worker messages
   * @returns the processed stream results
   */
  async processStream(
    stream: IIntegrationStream,
    context: IStepContext,
  ): Promise<IProcessStreamResults> {
    switch (stream.value.split(':')[0]) {
      case 'questions_by_tag':
        return this.tagStream(stream, context)
      case 'answers_to_question':
        return this.answersStream(stream, context)
      default:
        return this.keywordStream(stream, context)
    }
  }

  /**
   * Process a stream of type tags. It will fetch the questions with corresponding tags (AND between them) and process them into crowd.dev activities. If only tag is provided, it will fetch all questions with that tag.
   * If there is a new page of questions, it will add it as the nextPageStream.
   * For each question, it will create a new stream to fetch its answers.
   * @param stream the full stream information
   * @param context context passed along worker messages
   * @returns the processed stream results
   */
  async tagStream(
    stream: IIntegrationStream,
    context: IStepContext,
  ): Promise<IProcessStreamResults> {
    const tags = stream.metadata.tags as string[] // it's really just one tag
    const page = stream.metadata.page as number
    const response: StackOverflowQuestionsResponse = await getQuestionsByTags(
      { tags, page, nangoId: context.pipelineData.nangoId },
      context.logger,
    )

    const questions = response.items

    if ((questions.length as any) === 0) {
      return {
        operations: [],
        lastRecord: undefined,
        lastRecordTimestamp: undefined,
        // sleep: 1.5,
        newStreams: [],
      }
    }
    // Shows if there are more pages to parse
    const hasMore = response.has_more
    const activities: AddActivitiesSingle[] = []

    for (const question of questions) {
      activities.push(
        await this.parseQuestion(context.integration.tenantId, question, context, {
          tag: tags[0],
          keyword: null,
        }),
      )
    }
    const lastRecord = activities.length > 0 ? activities[0] : undefined

    // If we got results, we will want to check the next page
    const nextPageStream: IPendingStream =
      questions.length > 0 && hasMore
        ? { value: stream.value, metadata: { ...(stream.metadata || {}), page: page + 1 } }
        : undefined

    // For each question, we need to create a stream to get all its answers
    const newStreams = questions.map((question) => ({
      value: `answers_to_question:${question.question_id}`,
      metadata: {
        questionId: question.question_id,
        tag: tags[0],
        keyword: null,
        page: 1,
      },
    }))

    return {
      operations: [
        {
          type: Operations.UPSERT_ACTIVITIES_WITH_MEMBERS,
          records: activities,
        },
      ],
      nextPageStream,
      lastRecord,
      lastRecordTimestamp: lastRecord ? lastRecord.timestamp.getTime() : undefined,
      // sleep: 1.5,
      newStreams,
    }
  }

  /**
   * Process a stream of type answers. It will fetch the answers to a corresponding question and process them into crowd.dev activities.
   * If there is a new page of answers, it will add it as the nextPageStream.
   * @param stream the full stream information
   * @param context context passed along worker messages
   * @returns the processed stream results
   */
  async answersStream(
    stream: IIntegrationStream,
    context: IStepContext,
  ): Promise<IProcessStreamResults> {
    const questionId = stream.metadata.questionId as string
    const page = stream.metadata.page as number
    const response: StackOverflowAnswerResponse = await getAnswers(
      { questionId, page, nangoId: context.pipelineData.nangoId },
      context.logger,
    )

    const answers = response.items

    if ((answers.length as any) === 0) {
      return {
        operations: [],
        lastRecord: undefined,
        lastRecordTimestamp: undefined,
        // sleep: 1.5,
        newStreams: [],
      }
    }
    // Shows if there are more pages to parse
    const hasMore = response.has_more

    const activities = await this.parseAnswers(context.integration.tenantId, answers, context, {
      keyword: stream.metadata.keyword,
      tag: stream.metadata.tag,
    })
    const lastRecord = activities.length > 0 ? activities[0] : undefined

    // If we got results, we will want to check the next page
    const nextPageStream: IPendingStream =
      answers.length > 0 && hasMore
        ? { value: stream.value, metadata: { ...(stream.metadata || {}), page: page + 1 } }
        : undefined

    return {
      operations: [
        {
          type: Operations.UPSERT_ACTIVITIES_WITH_MEMBERS,
          records: activities,
        },
      ],
      nextPageStream,
      lastRecord,
      lastRecordTimestamp: lastRecord ? lastRecord.timestamp.getTime() : undefined,
      // sleep: 1.5,
      newStreams: [],
    }
  }

  /**
   * Process a stream of type keywords. It will fetch the questions with correspondin keywords and process them into crowd.dev activities.
   * If there is a new page of questions, it will add it as the nextPageStream.
   * For each question, it will create a new stream to fetch its answers.
   * @param stream the full stream information
   * @param context context passed along worker messages
   * @returns the processed stream results
   */
  async keywordStream(
    stream: IIntegrationStream,
    context: IStepContext,
  ): Promise<IProcessStreamResults> {
    const keyword = stream.metadata.keyword as string
    const page = stream.metadata.page as number
    const response: StackOverflowQuestionsResponse = await getQuestionsByKeyword(
      { keyword, page, nangoId: context.pipelineData.nangoId },
      context.logger,
    )

    const questions = response.items

    if ((questions.length as any) === 0) {
      return {
        operations: [],
        lastRecord: undefined,
        lastRecordTimestamp: undefined,
        // sleep: 1.5,
        newStreams: [],
      }
    }

    // Shows if there are more pages to parse
    const hasMore = response.has_more
    const activities: AddActivitiesSingle[] = []

    for (const question of questions) {
      activities.push(
        await this.parseQuestion(context.integration.tenantId, question, context, {
          keyword,
          tag: null,
        }),
      )
    }
    const lastRecord = activities.length > 0 ? activities[0] : undefined

    // If we got results, we will want to check the next page
    const nextPageStream: IPendingStream =
      questions.length > 0 && hasMore
        ? { value: stream.value, metadata: { ...(stream.metadata || {}), page: page + 1 } }
        : undefined

    // For each question, we need to create a stream to get all its answers
    const newStreams = questions.map((question) => ({
      value: `answers_to_question:${question.question_id}`,
      metadata: {
        questionId: question.question_id,
        keyword,
        tag: null,
        page: 1,
      },
    }))

    return {
      operations: [
        {
          type: Operations.UPSERT_ACTIVITIES_WITH_MEMBERS,
          records: activities,
        },
      ],
      nextPageStream,
      lastRecord,
      lastRecordTimestamp: lastRecord ? lastRecord.timestamp.getTime() : undefined,
      // sleep: 1.5,
      newStreams,
    }
  }

  /**
   * Parse a question from the Stack Overflow API into a crowd.dev activity
   * @param tenantId the tenant ID
   * @param tags questions with these tags will be fetched
   * @param question the question from the StackOverflow API
   * @returns a question parsed as a crowd.dev activity
   */
  private async parseQuestion(
    tenantId,
    question: StackOverflowShallowQuestion,
    context: IStepContext,
    { keyword, tag },
  ): Promise<AddActivitiesSingle> {
    context.logger.info(`Parsing question ${question.question_id}`)
    const body = question.body
      ? sanitizeHtml(he.decode(question.body))
      : `<a href="${question.link}" target="__blank">${question.link}</a>`

    let member: Member | undefined = await this.parseMember(question.owner.user_id, context)

    if (member === undefined && question.owner.display_name) {
      member = {
        username: {
          [PlatformType.STACKOVERFLOW]: {
            username: question.owner.display_name,
            integrationId: context.integration.id,
          },
        } as PlatformIdentities,
      }
    }

    const activity = {
      member,
      username: member.username[PlatformType.STACKOVERFLOW].username,
      tenant: tenantId,
      sourceId: question.question_id.toString(),
      type: StackOverflowActivityType.QUESTION,
      platform: PlatformType.STACKOVERFLOW,
      timestamp: new Date(question.creation_date * 1000),
      body,
      title: question.title,
      url: `https://stackoverflow.com/questions/${question.question_id}`,
      score: STACKOVERFLOW_GRID[StackOverflowActivityType.QUESTION].score,
      isContribution: STACKOVERFLOW_GRID[StackOverflowActivityType.QUESTION].isContribution,
      attributes: {
        tags: question.tags,
        answerCount: question.answer_count,
        viewCount: question.view_count,
        isAnswered: question.is_answered,
        ...(keyword && { keywordMentioned: keyword }),
        ...(tag && { tagMentioned: tag }),
      },
    }

    return activity
  }

  /**
   * Parse a question from the Stack Overflow API into a crowd.dev activity
   * @param tenantId the tenant ID
   * @param tags questions with these tags will be fetched
   * @param question the question from the StackOverflow API
   * @returns a question parsed as a crowd.dev activity
   */
  private async parseAnswers(
    tenantId,
    answers: StackOverflowAnswer[],
    context: IStepContext,
    { keyword, tag },
  ): Promise<AddActivitiesSingle[]> {
    const activities: AddActivitiesSingle[] = []
    for (let i = 0; i < answers.length; i++) {
      const answer = answers[i]
      const body = answer.body
        ? sanitizeHtml(he.decode(answer.body))
        : `<a href="${answer.link}" target="__blank">${answer.link}</a>`
      let member: Member | undefined = await this.parseMember(answer.owner.user_id, context)
      if (member === undefined && answer.owner.display_name) {
        member = {
          username: {
            [PlatformType.STACKOVERFLOW]: {
              username: answer.owner.display_name,
              integrationId: context.integration.id,
            },
          } as PlatformIdentities,
        }
      }

      activities.push({
        tenant: tenantId,
        sourceId: answer.answer_id.toString(),
        sourceParentId:
          i === 0 ? answer.question_id.toString() : answers[i - 1].answer_id.toString(),
        type: StackOverflowActivityType.ANSWER,
        platform: PlatformType.STACKOVERFLOW,
        timestamp: new Date(answer.creation_date * 1000),
        body,
        score: STACKOVERFLOW_GRID[StackOverflowActivityType.ANSWER].score,
        isContribution: STACKOVERFLOW_GRID[StackOverflowActivityType.ANSWER].isContribution,
        attributes: {
          ...(keyword && { keywordMentioned: keyword }),
          ...(tag && { tagMentioned: tag }),
        },
        member,
        username: member.username[PlatformType.STACKOVERFLOW].username,
      })
    }
    return activities
  }

  private async parseMember(userId: number, context: IStepContext): Promise<any> {
    if (userId === undefined || userId == null) {
      return undefined
    }

    const membersCache: RedisCache = context.pipelineData.membersCache

    context.logger.info(`Parsing member ${userId}`)

    const cached = await membersCache.get(userId.toString())
    if (cached) {
      if (cached === 'null') {
        return undefined
      }

      return JSON.parse(cached)
    }
    const member = await this.getMember(userId, context)

    if (member) {
      await membersCache.set(userId.toString(), JSON.stringify(member), 24 * 60 * 60)

      return member
    }

    await membersCache.set(userId.toString(), 'null', 24 * 60 * 60)
    return undefined
  }

  private async getMember(userId: number, context: IStepContext): Promise<Member> {
    const user = await getUser(
      {
        userId: userId.toString(),
        nangoId: context.pipelineData.nangoId,
      },
      context.logger,
    )
    return {
      username: {
        [PlatformType.STACKOVERFLOW]: {
          username: user.display_name,
          integrationId: context.integration.id,
          sourceId: user.user_id.toString(),
        },
      } as PlatformIdentities,
      attributes: {
        [MemberAttributeName.SOURCE_ID]: {
          [PlatformType.STACKOVERFLOW]: user.user_id.toString(),
        },
        ...(user.profile_image && {
          [MemberAttributeName.AVATAR_URL]: {
            [PlatformType.STACKOVERFLOW]: user.profile_image,
          },
        }),
        ...(user.link && {
          [MemberAttributeName.URL]: {
            [PlatformType.STACKOVERFLOW]: user.link,
          },
        }),
        ...(user.location && {
          [MemberAttributeName.LOCATION]: {
            [PlatformType.STACKOVERFLOW]: user.location,
          },
        }),
        ...(user.about_me && {
          [MemberAttributeName.BIO]: {
            [PlatformType.STACKOVERFLOW]: user.about_me,
          },
        }),
        ...(user.website_url && {
          [MemberAttributeName.WEBSITE_URL]: {
            [PlatformType.STACKOVERFLOW]: user.website_url,
          },
        }),
      },
    }
  }
}
