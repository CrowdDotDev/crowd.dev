import vader from 'crowd-sentiment'
import isEqual from 'lodash.isequal'
import mergeWith from 'lodash.mergewith'
import moment from 'moment-timezone'

import {
  distinct,
  distinctBy,
  escapeNullByte,
  generateUUIDv1,
  isObjectEmpty,
  single,
  singleOrDefault,
  trimUtf8ToMaxByteLength,
} from '@crowd/common'
import { UnrepeatableError } from '@crowd/common'
import { SearchSyncWorkerEmitter } from '@crowd/common_services'
import {
  findCommitsForPRSha,
  findMatchingPullRequestNodeId,
  insertActivities,
  queryActivities,
} from '@crowd/data-access-layer'
import { updateActivities } from '@crowd/data-access-layer/src/activities/update'
import { DbStore, arePrimitivesDbEqual } from '@crowd/data-access-layer/src/database'
import {
  IDbActivity,
  IDbActivityCreateData,
  IDbActivityUpdateData,
} from '@crowd/data-access-layer/src/old/apps/data_sink_worker/repo/activity.data'
import GithubReposRepository from '@crowd/data-access-layer/src/old/apps/data_sink_worker/repo/githubRepos.repo'
import GitlabReposRepository from '@crowd/data-access-layer/src/old/apps/data_sink_worker/repo/gitlabRepos.repo'
import { IDbMember } from '@crowd/data-access-layer/src/old/apps/data_sink_worker/repo/member.data'
import MemberRepository from '@crowd/data-access-layer/src/old/apps/data_sink_worker/repo/member.repo'
import RequestedForErasureMemberIdentitiesRepository from '@crowd/data-access-layer/src/old/apps/data_sink_worker/repo/requestedForErasureMemberIdentities.repo'
import SettingsRepository from '@crowd/data-access-layer/src/old/apps/data_sink_worker/repo/settings.repo'
import { dbStoreQx } from '@crowd/data-access-layer/src/queryExecutor'
import { DEFAULT_ACTIVITY_TYPE_SETTINGS, GithubActivityType } from '@crowd/integrations'
import { GitActivityType } from '@crowd/integrations/src/integrations/git/types'
import { Logger, LoggerBase, logExecutionTimeV2 } from '@crowd/logging'
import { IQueue } from '@crowd/queue'
import { RedisClient } from '@crowd/redis'
import { Client as TemporalClient } from '@crowd/temporal'
import {
  IActivityData,
  IMemberData,
  ISentimentAnalysisResult,
  MemberAttributeName,
  MemberIdentityType,
  PlatformType,
} from '@crowd/types'

import { IActivityUpdateData, ISentimentActivityInput } from './activity.data'
import MemberService from './member.service'
import MemberAffiliationService from './memberAffiliation.service'

/* eslint-disable @typescript-eslint/no-explicit-any */
// TODO: uros remove this
/* eslint-disable @typescript-eslint/no-unused-vars */

export default class ActivityService extends LoggerBase {
  private readonly settingsRepo: SettingsRepository
  private readonly memberRepo: MemberRepository
  private readonly memberAffiliationService: MemberAffiliationService
  private readonly githubReposRepo: GithubReposRepository
  private readonly gitlabReposRepo: GitlabReposRepository
  private readonly requestedForErasureMemberIdentitiesRepo: RequestedForErasureMemberIdentitiesRepository

  constructor(
    private readonly pgStore: DbStore,
    private readonly qdbStore: DbStore,
    private readonly searchSyncWorkerEmitter: SearchSyncWorkerEmitter,
    private readonly redisClient: RedisClient,
    private readonly temporal: TemporalClient,
    private readonly client: IQueue,
    parentLog: Logger,
  ) {
    super(parentLog)

    this.settingsRepo = new SettingsRepository(this.pgStore, this.log)
    this.memberRepo = new MemberRepository(this.pgStore, this.log)
    this.memberAffiliationService = new MemberAffiliationService(this.pgStore, this.log)
    this.githubReposRepo = new GithubReposRepository(this.pgStore, this.redisClient, this.log)
    this.gitlabReposRepo = new GitlabReposRepository(this.pgStore, this.redisClient, this.log)
    this.requestedForErasureMemberIdentitiesRepo =
      new RequestedForErasureMemberIdentitiesRepository(this.pgStore, this.log)
  }

  public async prepareForUpsert(
    resultId: string,
    segmentId: string,
    timestamp: Date,
    activity: IActivityUpdateData,
    memberInfo: { isBot: boolean; isTeamMember: boolean },
    original?: IDbActivity,
  ): Promise<IActivityPrepareForUpsertResult> {
    const id = original?.id || generateUUIDv1()

    let typeToCreate = activity.type
    let channelToCreate = activity.channel

    let payload: IDbActivityCreateData | undefined

    if (original) {
      const toUpdate = await this.mergeActivityData(activity, original)

      if (!isObjectEmpty(toUpdate)) {
        typeToCreate = toUpdate.type
        channelToCreate = toUpdate.channel

        this.log.trace('Updating an existing activity!')
        payload = {
          id,
          memberId: toUpdate.memberId || original.memberId,
          timestamp: original.timestamp,
          platform: toUpdate.platform || (original.platform as PlatformType),
          type: toUpdate.type || original.type,
          isContribution: toUpdate.isContribution || original.isContribution,
          score: toUpdate.score || original.score,
          sourceId: toUpdate.sourceId || original.sourceId,
          sourceParentId: toUpdate.sourceParentId || original.sourceParentId,
          attributes: toUpdate.attributes || original.attributes,
          sentiment: toUpdate.sentiment || original.sentiment,
          body: escapeNullByte(toUpdate.body || original.body),
          title: escapeNullByte(toUpdate.title || original.title),
          channel: toUpdate.channel || original.channel,
          url: toUpdate.url || original.url,
          username: toUpdate.username || original.username,
          objectMemberId: activity.objectMemberId,
          objectMemberUsername: activity.objectMemberUsername,
          segmentId: segmentId,
          organizationId: toUpdate.organizationId || original.organizationId,
          isBotActivity: memberInfo.isBot,
          isTeamMemberActivity: memberInfo.isTeamMember,
          importHash: original.importHash,
          createdAt: original.createdAt,
        }
      }
    } else {
      this.log.trace('Creating a new activity!')
      const sentimentPromise = this.getActivitySentiment({
        body: activity.body,
        title: activity.title,
        type: activity.type,
        platform: activity.platform,
      })

      payload = {
        id,
        timestamp: timestamp.toISOString(),
        platform: activity.platform,
        type: activity.type,
        isContribution: activity.isContribution,
        score: activity.score,
        sourceId: activity.sourceId,
        sourceParentId: activity.sourceParentId,
        memberId: activity.memberId,
        attributes: activity.attributes,
        sentiment: await sentimentPromise,
        title: activity.title,
        body: escapeNullByte(activity.body),
        channel: activity.channel,
        url: activity.url,
        username: activity.username,
        objectMemberId: activity.objectMemberId,
        objectMemberUsername: activity.objectMemberUsername,
        segmentId: segmentId,
        organizationId: activity.organizationId,
        isBotActivity: memberInfo.isBot,
        isTeamMemberActivity: memberInfo.isTeamMember,
      }
    }

    return {
      resultId,
      activityId: id,
      typeToCreate,
      channelToCreate,

      payload,
    }
  }

  private async mergeActivityData(
    data: IActivityUpdateData,
    original: IDbActivity,
  ): Promise<IDbActivityUpdateData> {
    let calcSentiment = false

    let body: string | undefined
    if (!arePrimitivesDbEqual(original.body, data.body)) {
      body = data.body
      calcSentiment = true
    }

    let title: string | undefined
    if (!arePrimitivesDbEqual(original.title, data.title)) {
      title = data.title
      calcSentiment = true
    }

    let sentiment: Promise<ISentimentAnalysisResult | undefined>
    if (calcSentiment) {
      sentiment = this.getActivitySentiment({
        body: body,
        title: title,
        type: original.type,
        platform: original.platform,
      })
    } else {
      sentiment = Promise.resolve(undefined)
    }

    let type: string | undefined
    if (!arePrimitivesDbEqual(original.type, data.type)) {
      type = data.type
    }

    let isContribution: boolean | undefined
    if (!arePrimitivesDbEqual(original.isContribution, data.isContribution)) {
      isContribution = data.isContribution
    }

    let score: number | undefined
    if (!arePrimitivesDbEqual(original.score, data.score)) {
      score = data.score
    }

    let sourceId: string | undefined
    if (!arePrimitivesDbEqual(original.sourceId, data.sourceId)) {
      sourceId = data.sourceId
    }

    let sourceParentId: string | undefined
    if (!arePrimitivesDbEqual(original.sourceParentId, data.sourceParentId)) {
      sourceParentId = data.sourceParentId
    }

    let memberId: string | undefined
    if (!arePrimitivesDbEqual(original.memberId, data.memberId)) {
      memberId = data.memberId
    }

    let username: string | undefined
    if (!arePrimitivesDbEqual(original.username, data.username)) {
      username = data.username
    }

    let objectMemberId: string | undefined
    if (!arePrimitivesDbEqual(original.objectMemberId, data.objectMemberId)) {
      objectMemberId = data.objectMemberId
    }

    let objectMemberUsername: string | undefined
    if (!arePrimitivesDbEqual(original.objectMemberUsername, data.objectMemberUsername)) {
      objectMemberUsername = data.objectMemberUsername
    }

    let attributes: Record<string, unknown> | undefined
    if (data.attributes && Object.keys(data.attributes).length > 0) {
      const temp = mergeWith({}, original.attributes, data.attributes)

      if (!isEqual(temp, original.attributes)) {
        attributes = temp
      }
    }

    let channel: string | undefined
    if (!arePrimitivesDbEqual(original.channel, data.channel)) {
      channel = data.channel
    }

    let url: string | undefined
    if (!arePrimitivesDbEqual(original.url, data.url)) {
      url = data.url
    }

    let organizationId: string | undefined
    if (!arePrimitivesDbEqual(original.organizationId, data.organizationId)) {
      organizationId = data.organizationId
    }

    let platform: PlatformType | undefined
    if (!arePrimitivesDbEqual(original.platform, data.platform)) {
      platform = data.platform
    }

    return {
      type,
      isContribution,
      score,
      sourceId,
      sourceParentId,
      memberId,
      username,
      objectMemberId,
      objectMemberUsername,
      sentiment: await sentiment,
      attributes,
      body,
      title,
      channel,
      url,
      organizationId,
      platform,
    }
  }

  private prepareMemberData(
    data: { resultId: string; activity: IActivityData; platform: PlatformType }[],
  ): Map<string, { success: boolean; err?: any }> {
    const results = new Map<string, { success: boolean; err?: any }>()

    for (const { resultId, activity, platform } of data) {
      if (!activity.username && !activity.member) {
        this.log.error({ platform, activity }, 'Activity does not have a username or member.')
        results.set(resultId, {
          success: false,
          err: new UnrepeatableError('Activity does not have a username or member.'),
        })

        continue
      }

      let member = activity.member
      const username = activity.username ? activity.username.trim() : undefined
      if (!member && username) {
        member = {
          identities: [
            {
              platform,
              value: username,
              type: MemberIdentityType.USERNAME,
              verified: true,
            },
          ],
        }
      }

      member.identities = member.identities.filter((i) => i.value)

      if (!username) {
        const identity = singleOrDefault(
          activity.member.identities,
          (i) => i.platform === platform && i.type === MemberIdentityType.USERNAME,
        )
        if (!identity) {
          this.log.error(
            { platform, activity },
            `Activity's member does not have an identity for the platform!`,
          )
          results.set(resultId, {
            success: false,
            err: new UnrepeatableError(
              `Activity's member does not have an identity for the platform: ${platform}!`,
            ),
          })

          continue
        }

        activity.username = identity.value
      }

      if (!member.attributes) {
        member.attributes = {}
      }

      const objectMemberUsername = activity.objectMemberUsername
        ? activity.objectMemberUsername.trim()
        : undefined
      let objectMember = activity.objectMember

      if (objectMember) {
        objectMember.identities = objectMember.identities.filter((i) => i.value)
      }

      if (objectMember && !objectMemberUsername) {
        const identity = singleOrDefault(
          objectMember.identities,
          (i) => i.platform === platform && i.type === MemberIdentityType.USERNAME,
        )
        if (!identity) {
          this.log.error(
            { platform, activity },
            `Activity's  object member does not have an identity for the platform!`,
          )
          results.set(resultId, {
            success: false,
            err: new UnrepeatableError(
              `Activity's object member does not have an identity for the platform: ${platform}!`,
            ),
          })

          continue
        }
        activity.objectMemberUsername = identity.value
      } else if (objectMemberUsername && !objectMember) {
        objectMember = {
          identities: [
            {
              platform,
              value: objectMemberUsername,
              type: MemberIdentityType.USERNAME,
              verified: true,
            },
          ],
        }
      }

      results.set(resultId, { success: true })
    }

    return results
  }

  public async processActivities(
    payloads: IActivityProcessData[],
    onboarding: boolean,
  ): Promise<Map<string, { success: boolean; err?: any }>> {
    const resultMap = new Map<string, { success: boolean; err?: any }>()

    let relevantPayloads = payloads

    const prepareMemberResults = this.prepareMemberData(relevantPayloads)

    relevantPayloads = []
    for (const [resultId, { success, err }] of prepareMemberResults) {
      if (!success) {
        resultMap.set(resultId, { success: false, err })
      } else {
        relevantPayloads.push(single(payloads, (a) => a.resultId === resultId))
      }
    }

    if (relevantPayloads.length === 0) {
      return resultMap
    }

    const allMemberIdentities = relevantPayloads
      .flatMap((a) => a.activity.member.identities)
      .concat(
        relevantPayloads
          .filter((a) => a.activity.objectMember)
          .flatMap((a) => a.activity.objectMember.identities),
      )

    // handle identities that were requested to be erased by the user
    const toErase = await logExecutionTimeV2(
      async () =>
        this.requestedForErasureMemberIdentitiesRepo.someIdentitiesWereErasedByUserRequest(
          allMemberIdentities,
        ),
      this.log,
      'processActivities -> someIdentitiesWereErasedByUserRequest',
    )

    const handleErasure = (member: IMemberData, resultId: string): boolean => {
      const toEraseMemberIdentities = toErase.filter((e) =>
        member.identities.some((i) => {
          if (i.type === MemberIdentityType.EMAIL) {
            return e.type === i.type && e.value === i.value
          }

          return e.type === i.type && e.value === i.value && e.platform === i.platform
        }),
      )

      if (toEraseMemberIdentities.length > 0) {
        if (toEraseMemberIdentities.some((i) => i.verified)) {
          this.log.warn(
            {
              memberIdentities: member.identities,
            },
            'Member has identities that were requested to be erased by the user! Skipping activity processing!',
          )
          // set result to true cuz it was processed and we don't need to store error
          resultMap.set(resultId, { success: true })
          // remove activity from relevant activities because it's not valid anymore
          relevantPayloads = relevantPayloads.filter((a) => a.resultId !== resultId)

          return false
        } else {
          // remove unverified identities that were marked to be erased so they are not created
          member.identities = member.identities.filter((i) => {
            if (i.verified) return true

            const maybeToErase = toEraseMemberIdentities.find(
              (e) =>
                e.type === i.type &&
                e.value === i.value &&
                (e.type === MemberIdentityType.EMAIL || e.platform === i.platform),
            )

            if (maybeToErase) return false
            return true
          })

          if (member.identities.filter((i) => i.value).length === 0) {
            this.log.warn(
              'Member had at least one unverified identity removed as it was requested to be removed! Now there is no identities left - skipping processing!',
            )

            // set result map to true cuz it was processed and we don't need to store error
            resultMap.set(resultId, { success: true })
            // remove activity from relevant activities because it's not valid anymore
            relevantPayloads = relevantPayloads.filter((a) => a.resultId !== resultId)

            return false
          }
        }
      }

      return true
    }

    const promises = []

    const gitlabPayloads: IActivityProcessData[] = []
    const githubPayloads: IActivityProcessData[] = []
    for (const payload of relevantPayloads) {
      if (!handleErasure(payload.activity.member, payload.resultId)) {
        continue
      }

      if (
        payload.activity.objectMember &&
        !handleErasure(payload.activity.objectMember, payload.resultId)
      ) {
        continue
      }

      if (payload.platform === PlatformType.GITLAB) {
        gitlabPayloads.push(payload)
      } else if (payload.platform === PlatformType.GITHUB) {
        githubPayloads.push(payload)
      } else if (!payload.segmentId) {
        resultMap.set(payload.resultId, {
          success: false,
          err: 'No segmentId provided! Something went wrong - it should be integrations.segmentId by default!',
        })
        relevantPayloads = relevantPayloads.filter((a) => a.resultId !== payload.resultId)
      }
    }

    // determine segmentIds
    const distinctGitlabChannels = distinctBy(
      gitlabPayloads,
      (a) => `${a.integrationId}-${a.activity.channel}`,
    )

    const distinctGithubChannels = distinctBy(
      githubPayloads,
      (a) => `${a.integrationId}-${a.activity.channel}`,
    )

    promises.push(
      this.gitlabReposRepo
        .findSegmentsForRepos(
          distinctGitlabChannels.map((c) => {
            return { integrationId: c.integrationId, url: c.activity.channel }
          }),
        )
        .then((results) => {
          for (const result of results) {
            if (result.segmentId) {
              for (const payload of gitlabPayloads.filter(
                (g) =>
                  g.integrationId === result.integrationId && g.activity.channel === result.url,
              )) {
                payload.segmentId = result.segmentId
              }
            }
          }
        }),
    )

    promises.push(
      this.githubReposRepo
        .findSegmentsForRepos(
          distinctGithubChannels.map((c) => {
            return { integrationId: c.integrationId, url: c.activity.channel }
          }),
        )
        .then((results) => {
          for (const result of results) {
            if (result.segmentId) {
              for (const payload of githubPayloads.filter(
                (g) =>
                  g.integrationId === result.integrationId && g.activity.channel === result.url,
              )) {
                payload.segmentId = result.segmentId
              }
            }
          }
        }),
    )

    await Promise.all(promises)

    const orConditions = relevantPayloads.map((r) => {
      return {
        and: [
          { timestamp: { eq: r.activity.timestamp } },
          { sourceId: { eq: r.activity.sourceId } },
          { platform: { eq: r.activity.platform } },
          { type: { eq: r.activity.type } },
          { channel: { eq: r.activity.channel } },
        ],
      }
    })

    const existingActivitiesResult = await logExecutionTimeV2(
      async () =>
        queryActivities(this.qdbStore.connection(), {
          segmentIds: distinct(relevantPayloads.map((r) => r.segmentId)),
          filter: {
            and: [
              {
                timestamp: {
                  in: distinct(relevantPayloads.map((r) => r.activity.timestamp)),
                },
              },
              {
                or: orConditions,
              },
            ],
          },
          limit: relevantPayloads.length,
          noCount: true,
        }),
      this.log,
      'processActivities -> queryActivities',
    )

    // map existing activities to payloads for further processing
    const memberIdsToLoad = new Set<string>()
    const payloadsNotInDb: IActivityProcessData[] = []
    for (const payload of relevantPayloads) {
      payload.dbActivity = singleOrDefault(
        existingActivitiesResult.rows,
        (a) =>
          a.segmentId === payload.segmentId &&
          new Date(a.timestamp).getTime() === new Date(payload.activity.timestamp).getTime() &&
          a.type === payload.activity.type &&
          a.sourceId === payload.activity.sourceId &&
          (payload.activity.channel ? a.channel === payload.activity.channel : true),
      )

      // if we have member ids we can use them to load members from db
      if (payload.dbActivity) {
        memberIdsToLoad.add(payload.dbActivity.memberId)

        if (payload.dbActivity.objectMemberId) {
          memberIdsToLoad.add(payload.dbActivity.objectMemberId)
        }
      } else {
        payloadsNotInDb.push(payload)
      }
    }

    if (memberIdsToLoad.size > 0) {
      // load members by member ids
      const dbMembers = await logExecutionTimeV2(
        async () => this.memberRepo.findByIds(Array.from(memberIdsToLoad)),
        this.log,
        'processActivities -> memberRepo.findByIds',
      )

      // and map them to payloads
      for (const payload of relevantPayloads.filter((p) => p.dbActivity)) {
        payload.dbMember = singleOrDefault(dbMembers, (m) => m.id === payload.dbActivity.memberId)
        if (!payload.dbMember) {
          this.log.error(
            {
              memberId: payload.dbActivity.memberId,
            },
            'Member not found!',
          )

          resultMap.set(payload.resultId, {
            success: false,
            err: new UnrepeatableError(
              `Member with id '${payload.dbActivity.memberId}' not found for activity '${payload.dbActivity.id}'!`,
            ),
          })

          continue
        }

        if (payload.dbActivity.objectMemberId) {
          payload.dbObjectMember = singleOrDefault(
            dbMembers,
            (m) => m.id === payload.dbActivity.objectMemberId,
          )

          if (!payload.dbObjectMember) {
            this.log.error(
              {
                objectMemberId: payload.dbActivity.objectMemberId,
              },
              'Object member not found!',
            )

            resultMap.set(payload.resultId, {
              success: false,
              err: new UnrepeatableError(
                `Object member with id '${payload.dbActivity.objectMemberId}' not found for activity '${payload.dbActivity.id}'`,
              ),
            })
          }
        }
      }

      relevantPayloads = relevantPayloads.filter((p) => !resultMap.has(p.resultId))
    }

    if (payloadsNotInDb.length > 0) {
      // if we don't have db activity we need to load members by username
      const usernameFilter = payloadsNotInDb
        .map((p) => {
          return {
            platform: p.platform,
            username: p.activity.username,
            segmentId: p.segmentId,
          }
        })
        .concat(
          payloadsNotInDb
            .filter((p) => p.activity.objectMemberUsername)
            .map((p) => {
              return {
                platform: p.platform,
                username: p.activity.objectMemberUsername,
                segmentId: p.segmentId,
              }
            }),
        )

      const dbMembersByUsername = await logExecutionTimeV2(
        async () => this.memberRepo.findMembersByUsernames(usernameFilter),
        this.log,
        'processActivities -> memberRepo.findMembersByUsernames',
      )

      // and map them to payloads
      for (const [identity, dbMember] of dbMembersByUsername) {
        for (const payload of payloadsNotInDb.filter(
          (p) =>
            p.activity.platform === identity.platform &&
            p.activity.username.toLowerCase() === identity.value.toLowerCase(),
        )) {
          payload.dbMember = dbMember
        }

        for (const payload of payloadsNotInDb.filter(
          (p) =>
            p.activity.platform === identity.platform &&
            p.activity.objectMemberUsername &&
            p.activity.objectMemberUsername.toLowerCase() === identity.value.toLowerCase(),
        )) {
          payload.dbObjectMember = dbMember
        }
      }

      // or by email if we don't find anything by username
      const emails = new Set<string>()
      for (const payload of payloadsNotInDb.filter((p) => !p.dbMember)) {
        for (const identity of payload.activity.member.identities.filter(
          (i) => i.verified && i.type === MemberIdentityType.EMAIL,
        )) {
          emails.add(identity.value)
        }
      }
      for (const payload of payloadsNotInDb.filter(
        (p) => !p.dbObjectMember && p.activity.objectMember,
      )) {
        for (const identity of payload.activity.objectMember.identities.filter(
          (i) => i.verified && i.type === MemberIdentityType.EMAIL,
        )) {
          emails.add(identity.value)
        }
      }

      if (emails.size > 0) {
        const dbMembersByEmail = await logExecutionTimeV2(
          async () => this.memberRepo.findMembersByEmails(Array.from(emails)),
          this.log,
          'processActivities -> memberRepo.findMembersByEmails',
        )

        // and map them to payloads
        for (const [email, dbMember] of dbMembersByEmail) {
          for (const payload of payloadsNotInDb.filter(
            (p) =>
              !p.dbMember &&
              p.activity.member.identities.some(
                (i) =>
                  i.verified &&
                  i.type === MemberIdentityType.EMAIL &&
                  i.value.toLowerCase() === email.toLowerCase(),
              ),
          )) {
            payload.dbMember = dbMember
          }

          for (const payload of payloadsNotInDb.filter(
            (p) =>
              !p.dbObjectMember &&
              p.activity.objectMember &&
              p.activity.objectMember.identities.some(
                (i) =>
                  i.verified &&
                  i.type === MemberIdentityType.EMAIL &&
                  i.value.toLowerCase() === email.toLowerCase(),
              ),
          )) {
            payload.dbObjectMember = dbMember
          }
        }
      }
    }

    // we should have now all relevant dbActivity, dbMember and dbObjectMember set
    // we can now upsert activities and members

    const preparedActivities: IActivityPrepareForUpsertResult[] = []

    const memberService = new MemberService(
      this.pgStore,
      this.searchSyncWorkerEmitter,
      this.temporal,
      this.redisClient,
      this.log,
    )
    for (const payload of relevantPayloads) {
      const promises = []
      // update members and orgs with them
      if (payload.dbMember) {
        payload.memberId = payload.dbMember.id
        promises.push(
          memberService
            .update(
              payload.dbMember.id,
              payload.segmentId,
              payload.integrationId,
              {
                attributes: payload.activity.member.attributes,
                joinedAt: payload.activity.member.joinedAt
                  ? new Date(payload.activity.member.joinedAt)
                  : new Date(payload.activity.timestamp),
                identities: payload.activity.member.identities,
                organizations: payload.activity.member.organizations,
                reach: payload.activity.member.reach,
              },
              payload.dbMember,
              payload.platform,
            )
            .catch((err) => {
              resultMap.set(payload.resultId, {
                success: false,
                err,
              })
            }),
        )
      } else {
        promises.push(
          memberService
            .create(
              payload.segmentId,
              payload.integrationId,
              {
                displayName: payload.activity.member.displayName || payload.activity.username,
                attributes: payload.activity.member.attributes,
                joinedAt: payload.activity.member.joinedAt
                  ? new Date(payload.activity.member.joinedAt)
                  : new Date(payload.activity.timestamp),
                identities: payload.activity.member.identities,
                organizations: payload.activity.member.organizations,
                reach: payload.activity.member.reach,
              },
              payload.platform,
            )
            .then((memberId) => {
              payload.memberId = memberId
            })
            .catch((err) => {
              resultMap.set(payload.resultId, {
                success: false,
                err,
              })
            }),
        )
      }

      if (payload.dbObjectMember) {
        payload.objectMemberId = payload.dbObjectMember.id
        promises.push(
          memberService
            .update(
              payload.dbObjectMember.id,
              payload.segmentId,
              payload.integrationId,
              {
                attributes: payload.activity.objectMember.attributes,
                joinedAt: payload.activity.objectMember.joinedAt
                  ? new Date(payload.activity.objectMember.joinedAt)
                  : new Date(payload.activity.timestamp),
                identities: payload.activity.objectMember.identities,
                organizations: payload.activity.objectMember.organizations,
                reach: payload.activity.objectMember.reach,
              },
              payload.dbObjectMember,
              payload.platform,
            )
            .catch((err) => {
              resultMap.set(payload.resultId, {
                success: false,
                err,
              })
            }),
        )
      } else if (payload.activity.objectMember) {
        promises.push(
          memberService
            .create(
              payload.segmentId,
              payload.integrationId,
              {
                displayName:
                  payload.activity.objectMember.displayName ||
                  payload.activity.objectMemberUsername,
                attributes: payload.activity.objectMember.attributes,
                joinedAt: payload.activity.objectMember.joinedAt
                  ? new Date(payload.activity.objectMember.joinedAt)
                  : new Date(payload.activity.timestamp),
                identities: payload.activity.objectMember.identities,
                organizations: payload.activity.objectMember.organizations,
                reach: payload.activity.objectMember.reach,
              },
              payload.platform,
            )
            .then((memberId) => {
              payload.objectMemberId = memberId
            })
            .catch((err) => {
              resultMap.set(payload.resultId, {
                success: false,
                err,
              })
            }),
        )
      }

      await Promise.all(promises)

      if (resultMap.has(payload.resultId)) {
        continue
      }

      // associate activity with organization
      payload.organizationId = await this.memberAffiliationService.findAffiliation(
        payload.memberId,
        payload.segmentId,
        payload.activity.timestamp,
      )

      if (!payload.memberId) {
        this.log.error(`Member id not set - can't continue!`)
        throw new Error(`Member id not set - can't continue!`)
      }

      if (payload.activity.objectMember && !payload.objectMemberId) {
        this.log.error(`Object member id not set - can't continue!`)
        throw new Error(`Object member id not set - can't continue!`)
      }

      preparedActivities.push(
        await this.prepareForUpsert(
          payload.resultId,
          payload.segmentId,
          new Date(payload.activity.timestamp),
          {
            type: payload.activity.type,
            platform: payload.platform,
            sourceId: payload.activity.sourceId,
            isContribution: payload.activity.isContribution,
            score: payload.activity.score,
            sourceParentId:
              payload.platform === PlatformType.GITHUB &&
              payload.activity.type === GithubActivityType.AUTHORED_COMMIT &&
              payload.activity.sourceParentId
                ? // TODO uros optimize
                  await logExecutionTimeV2(
                    () =>
                      findMatchingPullRequestNodeId(this.qdbStore.connection(), payload.activity),
                    this.log,
                    'processActivity -> findMatchingPullRequestNodeId',
                  )
                : payload.activity.sourceParentId,
            memberId: payload.memberId,
            username: payload.activity.username,
            objectMemberId: payload.objectMemberId,
            objectMemberUsername: payload.activity.objectMemberUsername,
            attributes: payload.activity.attributes || {},
            body: payload.activity.body,
            title: payload.activity.title,
            channel: payload.activity.channel,
            url: payload.activity.url,
            organizationId: payload.organizationId,
          },
          {
            isBot: this.memberAttValue(
              MemberAttributeName.IS_BOT,
              payload.activity.member,
              payload.platform,
              payload.dbMember,
            ) as boolean,
            isTeamMember: this.memberAttValue(
              MemberAttributeName.IS_TEAM_MEMBER,
              payload.activity.member,
              payload.platform,
              payload.dbMember,
            ) as boolean,
          },
          payload.dbActivity,
        ),
      )
    }

    const preparedForUpsert = preparedActivities.filter((a) => a.payload)
    const toUpsert = preparedForUpsert.map((a) => a.payload)
    if (toUpsert.length > 0) {
      await insertActivities(this.client, toUpsert)
    }

    const createdTypes = new Set<string>()
    const createdChannels = new Set<string>()
    for (const prepared of preparedForUpsert) {
      if (
        prepared.typeToCreate &&
        !createdTypes.has(
          `${prepared.typeToCreate}:${prepared.payload.platform}:${prepared.payload.segmentId}`,
        )
      ) {
        await this.settingsRepo.createActivityType(
          prepared.payload.platform as PlatformType,
          prepared.typeToCreate,
          prepared.payload.segmentId,
        )

        createdTypes.add(
          `${prepared.typeToCreate}:${prepared.payload.platform}:${prepared.payload.segmentId}`,
        )
      }
      if (
        prepared.channelToCreate &&
        !createdChannels.has(
          `${prepared.payload.platform}:${prepared.payload.channel}:${prepared.payload.segmentId}`,
        )
      ) {
        await this.settingsRepo.createActivityChannel(
          prepared.payload.segmentId,
          prepared.payload.platform,
          prepared.channelToCreate,
        )

        createdChannels.add(
          `${prepared.payload.platform}:${prepared.payload.channel}:${prepared.payload.segmentId}`,
        )
      }

      resultMap.set(prepared.resultId, { success: true })

      await this.searchSyncWorkerEmitter.triggerMemberSync(
        prepared.payload.memberId,
        onboarding,
        prepared.payload.segmentId,
      )

      if (prepared.payload.objectMemberId) {
        await this.searchSyncWorkerEmitter.triggerMemberSync(
          prepared.payload.objectMemberId,
          onboarding,
          prepared.payload.segmentId,
        )
      }

      if (prepared.payload.organizationId) {
        await this.redisClient.sAdd(
          'organizationIdsForAggComputation',
          prepared.payload.organizationId,
        )
      }
    }

    return resultMap
  }

  private memberAttValue(
    attName: MemberAttributeName,
    member: IMemberData,
    platform: PlatformType,
    dbMember?: IDbMember,
  ): unknown {
    let result: unknown
    if (dbMember && dbMember.attributes[attName]) {
      // db member already has this attribute
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const att = dbMember.attributes[attName] as any
      // if it's manually set we use that
      if (att.custom) {
        // manually set
        result = att.custom
      } else {
        // if it's not manually set we check if incoming member data has the attribute set for the platform
        if (member.attributes[attName] && member.attributes[attName][platform]) {
          result = member.attributes[attName][platform]
        } else {
          // if none of those work we just use db member attribute default value
          result = att.default
        }
      }
    } else if (member.attributes[attName] && member.attributes[attName][platform]) {
      result = member.attributes[attName][platform]
    }

    return result
  }

  public async getActivitySentiment(
    activity: ISentimentActivityInput,
  ): Promise<ISentimentAnalysisResult | undefined> {
    const settings = DEFAULT_ACTIVITY_TYPE_SETTINGS[activity.platform]?.[activity.type]

    if (settings && settings.calculateSentiment === true) {
      const ALLOWED_MAX_BYTE_LENGTH = 5000

      const prepareText = (text: string): string => {
        // https://docs.aws.amazon.com/comprehend/latest/APIReference/API_DetectSentiment.html
        // needs to be utf-8 encoded
        let prepared = Buffer.from(text).toString('utf8')
        // from docs - AWS performs analysis on the first 500 characters and ignores the rest

        // Remove Non-ASCII characters
        // eslint-disable-next-line no-control-regex
        prepared = prepared.replace(/[^\x00-\x7F]/g, '')

        prepared = prepared.slice(0, 500)
        // trim down to max allowed byte length
        prepared = trimUtf8ToMaxByteLength(prepared, ALLOWED_MAX_BYTE_LENGTH)

        return prepared.trim()
      }

      const text = `${activity.body || ''} ${activity.title || ''}`.trim()

      const preparedText = prepareText(text)

      if (preparedText.length === 0) {
        return undefined
      }

      const sentiment = vader.SentimentIntensityAnalyzer.polarity_scores(preparedText)
      const compound = Math.round(((sentiment.compound + 1) / 2) * 100)
      // Some activities are inherently different, we might want to dampen their sentiment

      let label = 'neutral'
      if (compound < 33) {
        label = 'negative'
      } else if (compound > 66) {
        label = 'positive'
      }

      return {
        positive: Math.round(sentiment.pos * 100),
        negative: Math.round(sentiment.neg * 100),
        neutral: Math.round(sentiment.neu * 100),
        mixed: Math.round(sentiment.neu * 100),
        sentiment: compound,
        label,
      }
    }

    return null
  }

  private async findMatchingActivity({
    segmentId,
    platform,
    activity,
  }: {
    segmentId: string
    platform: PlatformType
    activity: IActivityData
  }): Promise<IDbActivityCreateData | null> {
    const { rows } = await logExecutionTimeV2(
      () =>
        queryActivities(this.qdbStore.connection(), {
          segmentIds: [segmentId],
          filter: {
            platform: { eq: platform },
            sourceId: { eq: activity.sourceId },
            type: { eq: activity.type },
            channel: { eq: activity.channel },
            and: [
              { timestamp: { gt: moment(activity.timestamp).subtract(1, 'days').toISOString() } },
              { timestamp: { lt: moment(activity.timestamp).add(1, 'days').toISOString() } },
            ],
          },
          limit: 1,
          noCount: true,
        }),
      this.log,
      'findMatchingActivity -> queryActivities',
    )

    if (rows.length > 0) {
      return rows[0]
    }

    return null
  }

  private async findMatchingGitActivityAttributes({
    segmentId,
    activity,
    attributes,
  }: {
    segmentId: string
    activity: IActivityData
    attributes: Record<string, unknown>
  }): Promise<Record<string, unknown>> {
    if (
      activity.platform !== PlatformType.GITHUB ||
      activity.type !== GithubActivityType.AUTHORED_COMMIT
    ) {
      this.log.error(
        { activity },
        'You need to use github authored commit activity for finding matching git activity attributes',
      )
      return attributes
    }

    const gitActivity = await this.findMatchingActivity({
      segmentId,
      platform: PlatformType.GIT,
      activity,
    })
    if (!gitActivity) {
      return attributes
    }

    return {
      ...gitActivity.attributes,
      ...attributes,
    }
  }

  private async pushAttributesToMatchingGithubActivity({
    segmentId,
    activity,
  }: {
    segmentId: string
    activity: IActivityData
  }) {
    if (
      activity.platform !== PlatformType.GIT ||
      activity.type !== GitActivityType.AUTHORED_COMMIT
    ) {
      this.log.error(
        { activity },
        'You need to use git authored commit activity for pushing attributes to matching github activity',
      )
      return
    }

    const { attributes } = activity

    const updateActivityWithAttributes = async ({
      githubActivityId,
      gitAttributes,
    }: {
      githubActivityId: string
      gitAttributes: Record<string, unknown>
    }) => {
      await updateActivities(
        this.qdbStore.connection(),
        dbStoreQx(this.pgStore),
        this.client,
        async (activity) => ({
          attributes: {
            ...gitAttributes,
            ...activity.attributes,
          },
        }),
        `id = $(id)`,
        { id: githubActivityId },
      )
    }

    const githubActivity = await this.findMatchingActivity({
      segmentId,
      platform: PlatformType.GITHUB,
      activity,
    })
    if (!githubActivity) {
      return
    }

    await updateActivityWithAttributes({
      githubActivityId: githubActivity.id,
      gitAttributes: attributes,
    })
  }

  private async pushPRSourceIdToMatchingGithubCommits({ activity }: { activity: IActivityData }) {
    if (
      activity.platform !== PlatformType.GITHUB ||
      activity.type !== GithubActivityType.PULL_REQUEST_OPENED
    ) {
      return
    }

    const commits = await findCommitsForPRSha(
      this.qdbStore.connection(),
      activity.attributes.sha as string,
    )

    await updateActivities(
      this.qdbStore.connection(),
      dbStoreQx(this.pgStore),
      this.client,
      async () => ({
        sourceParentId: activity.sourceId,
      }),
      `id IN ($(commits))`,
      { commits },
    )
  }
}

interface IActivityProcessData {
  resultId: string
  integrationId: string
  onboarding: boolean
  platform: PlatformType
  activity: IActivityData
  segmentId: string

  dbMember?: IDbMember
  dbActivity?: IDbActivity
  dbObjectMember?: IDbMember

  organizationId?: string
  memberId?: string
  objectMemberId?: string
}

interface IActivityPrepareForUpsertResult {
  resultId: string
  activityId: string
  typeToCreate?: string
  channelToCreate?: string

  payload?: IDbActivityCreateData
}
