import sanitizeHtml from 'sanitize-html'
import he from 'he'
import { IStepContext, IIntegrationStream, IProcessStreamResults } from "../../../../types/integration/stepResult";
import { IntegrationType, PlatformType } from "../../../../types/integrationEnums";
import { IntegrationServiceBase } from "../integrationServiceBase";
import { StackOverflowAnswer, StackOverflowAnswerResponse, StackOverflowQuestionsResponse } from "../../types/stackOverflowTypes";
import getQuestions from "../../usecases/stackoverflow/getQuestions";
import getAnswers from '../../usecases/stackoverflow/getAnswers';
import Operations from "../../../dbOperations/operations";
import { AddActivitiesSingle, Member } from '../../types/messageTypes';
import { StackOverflowShallowQuestion } from '../../types/stackOverflowTypes';
import { StackOverflowActivityType } from '../../../../types/activityTypes';
import { StackOverflowGrid } from '../../grid/stackOverflowGrid';
import getUser from '../../usecases/stackoverflow/getUser';
import MemberAttributeSettingsService from '../../../../services/memberAttributeSettingsService';
import { StackOverflowMemberAttributes } from '../../../../database/attributes/member/stackOverflow';
import { MemberAttributeName } from '../../../../database/attributes/member/enums';
import { createRedisClient } from '../../../../utils/redis';
import { RedisCache } from '../../../../utils/redis/redisCache';


export class StackOverlflowIntegrationService extends IntegrationServiceBase {
    constructor() {
        super(IntegrationType.STACKOVERFLOW, 60);
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
    const settings = context.integration.settings;
    const redis = await createRedisClient(true);
    const membersCache = new RedisCache('stackoverflow-members', redis);
    context.pipelineData = {
      tags: settings.tags,
      nangoId: `${context.integration.tenantId}-${PlatformType.STACKOVERFLOW}`,
      membersCache,
    }
  }

    /**
     * Get the streams to process. In this case, we need one initial stream per set of tags.
     * @param context context passed along worker messages
     * @returns an array of streams to process
     */
    async getStreams(context: IStepContext): Promise<IIntegrationStream[]> {
        return [
            {
                value: `questions_by_tags:${(context.pipelineData.tags as string[]).join("-")}`,
                metadata: {
                    tags: context.pipelineData.tags,
                    page: 1,
                },
            }
        ]
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
        let newStreams: IIntegrationStream[]

        switch (stream.value.split(':')[0]) {
        case 'questions_by_tags':
            return this.tagsStream(stream, context);
        case 'answers_to_question':
            return this.answersStream(stream, context);
        }
    }

  /**
   * Process a stream of type tags. It will fetch the questions with corresponding tags (AND between them) and process them into crowd.dev activities.
   * If there is a new page of questions, it will add it as the nextPageStream.
   * For each question, it will create a new stream to fetch its answers.
   * @param stream the full stream information
   * @param context context passed along worker messages
   * @returns the processed stream results
   */
  async tagsStream(
    stream: IIntegrationStream,
    context: IStepContext,
  ): Promise<IProcessStreamResults> {
    const tags = stream.metadata.tags as string[];
    const page = stream.metadata.page as number;
    const response: StackOverflowQuestionsResponse = await getQuestions(
      { tags, page, nangoId: context.pipelineData.nangoId },
      context.logger,
    )

    const questions = response.items;

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
    const has_more = response.has_more;
    const activities: AddActivitiesSingle[] = [];

    for (const question of questions) {
      activities.push(await this.parseQuestion(context.integration.tenantId, question, context))
    }
    const lastRecord = activities.length > 0 ? activities[activities.length - 1] : undefined

    // If we got results, we will want to check the next page
    const nextPageStream: IIntegrationStream =
      questions.length > 0 && has_more
        ? { value: stream.value, metadata: { ...(stream.metadata || {}), page: page + 1  } }
        : undefined

    // For each question, we need to create a stream to get all its answers
    const newStreams = questions.map((question) => ({
      value: `answers_to_question:${question.question_id}`,
      metadata: {
        questionId: question.question_id,
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
    const questionId = stream.metadata.questionId as string;
    const page = stream.metadata.page as number;
    const response: StackOverflowAnswerResponse = await getAnswers(
      { questionId, page, nangoId: context.pipelineData.nangoId },
      context.logger,
    )

    const answers = response.items;

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
    const has_more = response.has_more;

    const activities = await this.parseAnswers(context.integration.tenantId, answers, context)
    const lastRecord = activities.length > 0 ? activities[activities.length - 1] : undefined

    // If we got results, we will want to check the next page
    const nextPageStream: IIntegrationStream =
      answers.length > 0 && has_more
        ? { value: stream.value, metadata: { ...(stream.metadata || {}), page: page + 1  } }
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
   * Parse a question from the Stack Overflow API into a crowd.dev activity
   * @param tenantId the tenant ID
   * @param tags questions with these tags will be fetched
   * @param question the question from the StackOverflow API
   * @returns a question parsed as a crowd.dev activity
   */
  private async parseQuestion(tenantId, question: StackOverflowShallowQuestion, context: IStepContext): Promise<AddActivitiesSingle> {
    context.logger.info(`Parsing question ${question.question_id}`);
    const body = question.body
      ? sanitizeHtml(he.decode(question.body))
      : `<a href="${question.link}" target="__blank">${question.link}</a>`
    const activity = {
      tenant: tenantId,
      sourceId: question.question_id.toString(),
      type: StackOverflowActivityType.QUESTION,
      platform: PlatformType.STACKOVERFLOW,
      timestamp: new Date(question.creation_date * 1000),
      body,
      title: question.title,
      url: `https://stackoverflow.com/questions/${question.question_id}`,
      score: StackOverflowGrid[StackOverflowActivityType.QUESTION].score,
      isKeyAction: StackOverflowGrid[StackOverflowActivityType.QUESTION].isKeyAction,
    }

    const member: Member | undefined = await this.parseMember(question.owner.user_id, context);
    return {
      ...activity,
      member
    }
  }

   /**
   * Parse a question from the Stack Overflow API into a crowd.dev activity
   * @param tenantId the tenant ID
   * @param tags questions with these tags will be fetched
   * @param question the question from the StackOverflow API
   * @returns a question parsed as a crowd.dev activity
   */
  private async parseAnswers(tenantId, answers: StackOverflowAnswer[], context: IStepContext): Promise<AddActivitiesSingle[]> {
    let activities: AddActivitiesSingle[] = [];
    for(let i = 0; i < answers.length; i++) {
    const answer = answers[i];
    const body = answer.body
      ? sanitizeHtml(he.decode(answer.body))
      : `<a href="${answer.link}" target="__blank">${answer.link}</a>`
    const member: Member | undefined = await this.parseMember(answer.owner.user_id, context);
    activities.push({
      tenant: tenantId,
      sourceId: answer.answer_id.toString(),
      sourceParentId: i === 0 ? answer.question_id.toString() : answers[i-1].answer_id.toString(),
      type: StackOverflowActivityType.ANSWER,
      platform: PlatformType.STACKOVERFLOW,
      timestamp: new Date(answer.creation_date * 1000),
      body,
      score: StackOverflowGrid[StackOverflowActivityType.ANSWER].score,
      isKeyAction: StackOverflowGrid[StackOverflowActivityType.ANSWER].isKeyAction,
      member
    })
    }
    return activities;
  }

  private async parseMember(userId: number, context: IStepContext): Promise<any> {
    const membersCache: RedisCache = context.pipelineData.membersCache;

    context.logger.info(`Parsing member ${userId}`);

    const cached = await membersCache.getValue(userId.toString());
    if (cached) {
      if (cached === 'null') {
        return undefined
      }

      return JSON.parse(cached)
    }
    const member = await this.getMember(userId, context);

    if (member) {
      await membersCache.setValue(userId.toString(), JSON.stringify(member), 24 * 60 * 60)

      return member;
    }

    await membersCache.setValue(userId.toString(), 'null', 24 * 60 * 60)
    return undefined;
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
      [PlatformType.STACKOVERFLOW]: user.display_name,
    },
    attributes: {
      [MemberAttributeName.SOURCE_ID]: {
          [PlatformType.STACKOVERFLOW]: user.user_id.toString(),
      },
      ...(user.profile_image && {
        [MemberAttributeName.AVATAR_URL]: {
          [PlatformType.STACKOVERFLOW]: user.profile_image,
        }
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
  },
   }
  }
}