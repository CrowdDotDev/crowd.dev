import lodash from 'lodash'
import { IntegrationType, PlatformType } from '@crowd/types'
import { IntegrationServiceBase } from '../integrationServiceBase'
import {
  IIntegrationStream,
  IProcessStreamResults,
  IStepContext,
  IStreamResultOperation,
} from '../../../../types/integration/stepResult'
import { TwitterIntegrationService } from './twitterIntegrationService'
import MemberRepository from '../../../../database/repositories/memberRepository'
import getProfiles from '../../usecases/twitter/getProfiles'
import { Updates } from '../../types/messageTypes'
import MemberService from '../../../../services/memberService'
import Operations from '../../../dbOperations/operations'

/* eslint class-methods-use-this: 0 */

/* eslint-disable @typescript-eslint/no-unused-vars */

export class TwitterReachIntegrationService extends IntegrationServiceBase {
  static readonly TWITTER_API_MAX_USERNAME_LENGTH = 15

  constructor() {
    super(IntegrationType.TWITTER_REACH, 24 * 60)
  }

  async preprocess(context: IStepContext): Promise<void> {
    await TwitterIntegrationService.refreshToken(context)

    context.pipelineData.members = await MemberRepository.findAndCountAll(
      { filter: { platform: PlatformType.TWITTER } },
      context.repoContext,
    )
  }

  async getStreams(context: IStepContext, metadata?: any): Promise<IIntegrationStream[]> {
    // Map to object filtering out undefined and long usernames
    const results = context.pipelineData.members.rows.reduce((acc, m) => {
      const username = m.username.twitter
      if (
        username !== undefined &&
        username.length < TwitterReachIntegrationService.TWITTER_API_MAX_USERNAME_LENGTH
      ) {
        acc.push({
          id: m.id,
          username: username.toLowerCase(),
          reach: m.reach,
        })
      }
      return acc
    }, [])

    const chunks = lodash.chunk(results, 99)

    let chunkIndex = 1
    return chunks.map((c) => ({
      value: `chunk-${chunkIndex++}`,
      metadata: {
        members: c,
      },
    }))
  }

  async processStream(
    stream: IIntegrationStream,
    context: IStepContext,
  ): Promise<IProcessStreamResults> {
    const members = stream.metadata.members.map((m) => m.username)
    const { records, nextPage, limit, timeUntilReset } = await getProfiles(
      {
        usernames: members,
        token: context.integration.token,
      },
      context.logger,
    )

    const nextPageStream = nextPage
      ? { value: stream.value, metadata: { page: nextPage } }
      : undefined
    const sleep = limit <= 1 ? timeUntilReset : undefined

    if (records.length === 0) {
      return {
        operations: [],
        nextPageStream,
        sleep,
      }
    }

    const results = this.parseReach(records, stream.metadata.members)

    return {
      operations: [
        {
          type: Operations.UPDATE_MEMBERS,
          records: results,
        },
      ],
      nextPageStream,
    }
  }

  async isProcessingFinished(
    context: IStepContext,
    currentStream: IIntegrationStream,
    lastOperations: IStreamResultOperation[],
    lastRecord?: any,
    lastRecordTimestamp?: number,
  ): Promise<boolean> {
    return true
  }

  /**
   * Get the followers number of followers
   * @param records List of records coming from the API
   * @param members Usernames we are working on
   * @returns The number of followers
   */
  parseReach(records: Array<any>, members: any[]): Updates {
    const out = []

    const hashedMembers = lodash.keyBy(members, 'username')
    records.forEach((record) => {
      record.username = record.username.toLowerCase()
      const member = hashedMembers[record.username]
      if (record.followersCount !== member.reach.twitter) {
        out.push({
          id: member.id,
          update: {
            reach: MemberService.calculateReach(member.reach || {}, {
              [PlatformType.TWITTER]: record.followersCount,
            }),
          },
        })
      }
    })

    return out
  }
}
