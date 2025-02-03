import vader from 'crowd-sentiment'
import isEqual from 'lodash.isequal'
import mergeWith from 'lodash.mergewith'
import moment from 'moment-timezone'

import {
  escapeNullByte,
  generateUUIDv4,
  isObjectEmpty,
  singleOrDefault,
  trimUtf8ToMaxByteLength,
} from '@crowd/common'
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
import IntegrationRepository from '@crowd/data-access-layer/src/old/apps/data_sink_worker/repo/integration.repo'
import { IDbMember } from '@crowd/data-access-layer/src/old/apps/data_sink_worker/repo/member.data'
import MemberRepository from '@crowd/data-access-layer/src/old/apps/data_sink_worker/repo/member.repo'
import RequestedForErasureMemberIdentitiesRepository from '@crowd/data-access-layer/src/old/apps/data_sink_worker/repo/requestedForErasureMemberIdentities.repo'
import SettingsRepository from '@crowd/data-access-layer/src/old/apps/data_sink_worker/repo/settings.repo'
import { DEFAULT_ACTIVITY_TYPE_SETTINGS, GithubActivityType } from '@crowd/integrations'
import { GitActivityType } from '@crowd/integrations/src/integrations/git/types'
import { Logger, LoggerBase, getChildLogger } from '@crowd/logging'
import { IQueue } from '@crowd/queue'
import { RedisClient } from '@crowd/redis'
import { Client as TemporalClient } from '@crowd/temporal'
import {
  IActivityData,
  ISentimentAnalysisResult,
  MemberAttributeName,
  MemberIdentityType,
  PlatformType,
} from '@crowd/types'

import { GITHUB_CONFIG } from '../conf'

import { IActivityCreateData, IActivityUpdateData, ISentimentActivityInput } from './activity.data'
import { UnrepeatableError } from './common'
import MemberService from './member.service'
import MemberAffiliationService from './memberAffiliation.service'

const IS_GITHUB_SNOWFLAKE_ENABLED = GITHUB_CONFIG().isSnowflakeEnabled === 'true'

export default class ActivityService extends LoggerBase {
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
  }

  public async create(
    tenantId: string,
    segmentId: string,
    activity: IActivityCreateData,
    memberInfo: { isBot: boolean; isTeamMember: boolean },
  ): Promise<string> {
    try {
      this.log.debug('Creating an activity.')

      const sentiment = await this.getActivitySentiment({
        body: activity.body,
        title: activity.title,
        type: activity.type,
        platform: activity.platform,
      })

      const id = await this.pgStore.transactionally(async (txStore) => {
        const txSettingsRepo = new SettingsRepository(txStore, this.log)

        await txSettingsRepo.createActivityType(
          tenantId,
          activity.platform as PlatformType,
          activity.type,
          segmentId,
        )

        if (activity.channel) {
          await txSettingsRepo.createActivityChannel(
            tenantId,
            segmentId,
            activity.platform,
            activity.channel,
          )
        }

        this.log.debug('Creating an activity in QuestDB!')
        try {
          await insertActivities(this.client, [
            {
              id: activity.id,
              timestamp: activity.timestamp.toISOString(),
              platform: activity.platform,
              type: activity.type,
              isContribution: activity.isContribution,
              score: activity.score,
              sourceId: activity.sourceId,
              sourceParentId: activity.sourceParentId,
              memberId: activity.memberId,
              tenantId: tenantId,
              attributes: activity.attributes,
              sentiment: sentiment,
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
              importHash: activity.importHash,
            },
          ])
        } catch (error) {
          this.log.error('Error creating activity in QuestDB:', error)
          throw error
        }

        return activity.id
      })

      return id
    } catch (err) {
      this.log.error(err, 'Error while creating an activity!')
      throw err
    }
  }

  public async update(
    id: string,
    tenantId: string,
    onboarding: boolean,
    segmentId: string,
    activity: IActivityUpdateData,
    original: IDbActivity,
    memberInfo: { isBot: boolean; isTeamMember: boolean },
    fireSync = true,
  ): Promise<void> {
    try {
      let toUpdate: IDbActivityUpdateData
      const updated = await this.pgStore.transactionally(async (txStore) => {
        const txSettingsRepo = new SettingsRepository(txStore, this.log)

        toUpdate = await this.mergeActivityData(activity, original)

        if (toUpdate.type) {
          await txSettingsRepo.createActivityType(
            tenantId,
            original.platform as PlatformType,
            toUpdate.type,
            segmentId,
          )
        }

        if (toUpdate.channel) {
          await txSettingsRepo.createActivityChannel(
            tenantId,
            segmentId,
            original.platform,
            toUpdate.channel,
          )
        }

        if (!isObjectEmpty(toUpdate)) {
          this.log.debug({ activityId: id }, 'Updating activity.')

          // use insert instead of update to avoid using pg protocol with questdb
          try {
            await insertActivities(this.client, [
              {
                id,
                memberId: toUpdate.memberId || original.memberId,
                timestamp: original.timestamp,
                platform: toUpdate.platform || (original.platform as PlatformType),
                type: toUpdate.type || original.type,
                isContribution: toUpdate.isContribution || original.isContribution,
                score: toUpdate.score || original.score,
                sourceId: toUpdate.sourceId || original.sourceId,
                sourceParentId: toUpdate.sourceParentId || original.sourceParentId,
                tenantId: tenantId,
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
              },
            ])
          } catch (error) {
            this.log.error('Error updating (by inserting) activity in QuestDB:', error)
            throw error
          }

          return true
        } else {
          this.log.debug({ activityId: id }, 'No changes to update in an activity.')
          return false
        }
      })

      if (updated) {
        // const activityToProcess: IQueryActivityResult = {
        //   id: id,
        //   tenantId: tenantId,
        //   segmentId: segmentId,
        //   type: toUpdate.type || original.type,
        //   isContribution: toUpdate.isContribution || original.isContribution,
        //   score: toUpdate.score || original.score,
        //   sourceId: toUpdate.sourceId || original.sourceId,
        //   sourceParentId: toUpdate.sourceParentId || original.sourceParentId,
        //   memberId: toUpdate.memberId || original.memberId,
        //   username: toUpdate.username || original.username,
        //   sentiment: toUpdate.sentiment || original.sentiment,
        //   attributes: toUpdate.attributes || original.attributes,
        //   body: escapeNullByte(toUpdate.body || original.body),
        //   title: escapeNullByte(toUpdate.title || original.title),
        //   channel: toUpdate.channel || original.channel,
        //   url: toUpdate.url || original.url,
        //   organizationId: toUpdate.organizationId || original.organizationId,
        //   platform: toUpdate.platform || (original.platform as PlatformType),
        //   timestamp: original.timestamp,
        // }

        if (fireSync) {
          await this.searchSyncWorkerEmitter.triggerMemberSync(
            tenantId,
            activity.memberId,
            onboarding,
            segmentId,
          )
        }
      }
    } catch (err) {
      this.log.error(err, { activityId: id }, 'Error while updating an activity!')
      throw err
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

  public async processActivity(
    tenantId: string,
    integrationId: string,
    onboarding: boolean,
    platform: PlatformType,
    activity: IActivityData,
    providedSegmentId?: string,
  ): Promise<void> {
    this.log = getChildLogger('ActivityService.processActivity', this.log, {
      integrationId,
      tenantId,
      sourceId: activity.sourceId,
    })

    this.log.debug({ tenantId, integrationId, platform }, 'Processing activity.')

    if (!activity.username && !activity.member) {
      this.log.error(
        { integrationId, platform, activity },
        'Activity does not have a username or member.',
      )
      throw new Error('Activity does not have a username or member.')
    }

    let username = activity.username
    if (!username) {
      const identity = singleOrDefault(
        activity.member.identities,
        (i) => i.platform === platform && i.type === MemberIdentityType.USERNAME,
      )
      if (!identity) {
        throw new UnrepeatableError(
          `Activity's member does not have an identity for the platform: ${platform}!`,
        )
      }

      username = identity.value
    }

    let member = activity.member
    if (!member) {
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

    if (!member.attributes) {
      member.attributes = {}
    }

    let objectMemberUsername = activity.objectMemberUsername
    let objectMember = activity.objectMember

    if (objectMember && !objectMemberUsername) {
      const identity = singleOrDefault(
        objectMember.identities,
        (i) => i.platform === platform && i.type === MemberIdentityType.USERNAME,
      )
      if (!identity) {
        this.log.error("Activity's object member does not have an identity for the platform.")
        throw new Error(
          `Activity's object member does not have an identity for the platform: ${platform}!`,
        )
      }

      objectMemberUsername = identity.value
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

    const repo = new RequestedForErasureMemberIdentitiesRepository(this.pgStore, this.log)

    // check if member or object member have identities that were requested to be erased by the user
    if (member && member.identities.length > 0) {
      this.log.trace('Checking member identities for erasue!')
      const toErase = await repo.someIdentitiesWereErasedByUserRequest(member.identities)
      if (toErase.length > 0) {
        // prevent member/activity creation of one of the identities that are marked to be erased are verified
        if (toErase.some((i) => i.verified)) {
          this.log.warn(
            { memberIdentities: member.identities },
            'Member has identities that were requested to be erased by the user! Skipping activity processing!',
          )
          return
        } else {
          // we just remove the unverified identities that were marked to be erased and prevent them from being created
          member.identities = member.identities.filter((i) => {
            if (i.verified) return true

            const maybeToErase = toErase.find(
              (e) => e.type === i.type && e.value === i.value && e.platform === i.platform,
            )

            if (maybeToErase) return false
            return true
          })

          if (member.identities.filter((i) => i.value).length === 0) {
            this.log.warn(
              'Member had at least one unverified identity removed as it was requested to be removed! Now there is no identities left - skipping processing!',
            )
            return
          }
        }
      }
    }

    if (objectMember && objectMember.identities.length > 0) {
      this.log.trace('Checking object member identities for erasue!')
      const toErase = await repo.someIdentitiesWereErasedByUserRequest(objectMember.identities)
      if (toErase.length > 0) {
        // prevent member/activity creation of one of the identities that are marked to be erased are verified
        if (toErase.some((i) => i.verified)) {
          this.log.warn(
            { objectMemberIdentities: objectMember.identities },
            'Object member has identities that were requested to be erased by the user! Skipping activity processing!',
          )
          return
        } else {
          // we just remove the unverified identities that were marked to be erased and prevent them from being created
          objectMember.identities = objectMember.identities.filter((i) => {
            if (i.verified) return true

            const maybeToErase = toErase.find(
              (e) => e.type === i.type && e.value === i.value && e.platform === i.platform,
            )

            if (maybeToErase) return false
            return true
          })

          if (objectMember.identities.filter((i) => i.value).length === 0) {
            this.log.warn(
              'Object member had at least one unverified identity removed as it was requested to be removed! Now there is no identities left - skipping processing!',
            )
            return
          }
        }
      }
    }

    let memberId: string
    let objectMemberId: string | undefined
    let memberIsBot = false
    let memberIsTeamMember = false
    let segmentId: string
    let organizationId: string

    const memberAttValue = (attName: MemberAttributeName, dbMember?: IDbMember): unknown => {
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

    await this.pgStore.transactionally(async (txStore) => {
      try {
        const txMemberRepo = new MemberRepository(txStore, this.log)
        const txMemberService = new MemberService(
          txStore,
          this.searchSyncWorkerEmitter,
          this.temporal,
          this.redisClient,
          this.log,
        )
        const txActivityService = new ActivityService(
          txStore,
          this.qdbStore,
          this.searchSyncWorkerEmitter,
          this.redisClient,
          this.temporal,
          this.client,
          this.log,
        )
        const txIntegrationRepo = new IntegrationRepository(txStore, this.log)
        const txMemberAffiliationService = new MemberAffiliationService(txStore, this.log)
        const txGithubReposRepo = new GithubReposRepository(txStore, this.log)
        const txGitlabReposRepo = new GitlabReposRepository(txStore, this.log)

        segmentId = providedSegmentId
        if (!segmentId) {
          if (platform === PlatformType.GITLAB) {
            this.log.trace('Finding segment for GitLab repo.')
            const gitlabRepoSegmentId = await txGitlabReposRepo.findSegmentForRepo(
              tenantId,
              activity.channel,
            )

            if (gitlabRepoSegmentId) {
              segmentId = gitlabRepoSegmentId
            }
          } else if (platform === PlatformType.GITHUB) {
            this.log.trace('Finding segment for Github repo.')
            const repoSegmentId = await txGithubReposRepo.findSegmentForRepo(
              tenantId,
              activity.channel,
            )

            if (repoSegmentId) {
              segmentId = repoSegmentId
            }
          }

          if (!segmentId) {
            this.log.trace('Finding segment for integration.')
            const dbIntegration = await txIntegrationRepo.findById(integrationId)
            segmentId = dbIntegration.segmentId
          }
        }

        // find existing activity
        this.log.trace('Finding existing activity.')
        const {
          rows: [dbActivity],
        } = await queryActivities(this.qdbStore.connection(), {
          tenantId,
          segmentIds: [segmentId],
          filter: {
            and: [
              { timestamp: { eq: activity.timestamp } },
              { sourceId: { eq: activity.sourceId } },
              { platform: { eq: platform } },
              { type: { eq: activity.type } },
              { channel: { eq: activity.channel } },
            ],
          },
          limit: 1,
        })

        if (dbActivity && dbActivity?.deletedAt) {
          // we found an existing activity but it's deleted - nothing to do here
          this.log.trace(
            { activityId: dbActivity.id },
            'Found existing activity but it is deleted, nothing to do here.',
          )
          return
        }

        let createActivity = false

        if (dbActivity) {
          this.log.trace({ activityId: dbActivity.id }, 'Found existing activity. Updating it.')
          // process member data

          let dbMember = await txMemberRepo.findMemberByUsername(
            tenantId,
            segmentId,
            platform,
            username,
          )
          if (dbMember) {
            // we found a member for the identity from the activity
            this.log.trace({ memberId: dbMember.id }, 'Found existing member.')

            // lets check if it's a match from what we have in the database activity that we got through sourceId
            if (dbActivity.memberId !== dbMember.id) {
              // the memberId from the dbActivity does not match the one we found from the identity
              // we should remove the activity and let it recreate itself with the correct member
              // this is probably a legacy problem before we had weak identities
              this.log.warn(
                {
                  activityMemberId: dbActivity.memberId,
                  memberId: dbMember.id,
                  activityType: activity.type,
                },
                'Exiting activity has a memberId that does not match the memberId for the platform:username identity! Deleting the activity!',
              )

              createActivity = true
            }

            // update the member
            await txMemberService.update(
              dbMember.id,
              tenantId,
              onboarding,
              segmentId,
              integrationId,
              {
                attributes: member.attributes,
                joinedAt: member.joinedAt
                  ? new Date(member.joinedAt)
                  : new Date(activity.timestamp),
                identities: member.identities,
                organizations: member.organizations,
                reach: member.reach,
              },
              dbMember,
              platform,
              false,
            )

            if (!createActivity) {
              // and use it's member id for the new activity
              dbActivity.memberId = dbMember.id
            }

            memberId = dbMember.id
            // determine isBot and isTeamMember
            memberIsBot = (memberAttValue(MemberAttributeName.IS_BOT, dbMember) as boolean) ?? false
            memberIsTeamMember =
              (memberAttValue(MemberAttributeName.IS_TEAM_MEMBER, dbMember) as boolean) ?? false
          } else {
            this.log.trace(
              'We did not find a member for the identity provided! Updating the one from db activity.',
            )
            // we did not find a member for the identity from the activity
            // which is weird since the memberId from the activity points to some member
            // that does not have the identity from the new activity
            // we should add the activity to the member
            // merge member data with the one from the activity and the one from the database
            // leave activity.memberId as is

            this.log.trace('Fetching dbActivity.memberId member data from db!')
            dbMember = await txMemberRepo.findById(dbActivity.memberId)
            this.log.trace('Updating member data!')
            await txMemberService.update(
              dbMember.id,
              tenantId,
              onboarding,
              segmentId,
              integrationId,
              {
                attributes: member.attributes,
                joinedAt: member.joinedAt
                  ? new Date(member.joinedAt)
                  : new Date(activity.timestamp),
                identities: member.identities,
                organizations: member.organizations,
                reach: member.reach,
              },
              dbMember,
              platform,
              false,
            )

            memberId = dbActivity.memberId
            // determine isBot and isTeamMember
            memberIsBot = (memberAttValue(MemberAttributeName.IS_BOT, dbMember) as boolean) ?? false
            memberIsTeamMember =
              (memberAttValue(MemberAttributeName.IS_TEAM_MEMBER, dbMember) as boolean) ?? false
          }

          // process object member data
          // existing activity has it but now we don't anymore
          if (dbActivity.objectMemberId && !objectMember) {
            // TODO what to do here?
            throw new Error(
              `Activity ${dbActivity.id} has an object member but newly generated one does not!`,
            )
          }

          if (objectMember) {
            if (dbActivity.objectMemberId) {
              this.log.trace('Finding object member id by username.')
              let dbObjectMember = await txMemberRepo.findMemberByUsername(
                tenantId,
                segmentId,
                platform,
                objectMemberUsername,
              )

              if (dbObjectMember) {
                // we found an existing object member for the identity from the activity
                this.log.trace(
                  { objectMemberId: dbObjectMember.id },
                  'Found existing object member.',
                )

                // lets check if it's a match from what we have in the database activity that we got through sourceId
                if (dbActivity.objectMemberId !== dbObjectMember.id) {
                  // the memberId from the dbActivity does not match the one we found from the identity
                  // we should remove the activity and let it recreate itself with the correct member
                  // this is probably a legacy problem before we had weak identities
                  this.log.warn(
                    {
                      activityObjectMemberId: dbActivity.objectMemberId,
                      objectMemberId: dbObjectMember.id,
                      activityType: activity.type,
                    },
                    'Exiting activity has a objectMemberId that does not match the object member for the platform:username identity! Deleting the activity!',
                  )

                  createActivity = true
                }

                // update the member
                this.log.trace('Updating object member data!')
                await txMemberService.update(
                  dbObjectMember.id,
                  tenantId,
                  onboarding,
                  segmentId,
                  integrationId,
                  {
                    attributes: objectMember.attributes,
                    joinedAt: objectMember.joinedAt
                      ? new Date(objectMember.joinedAt)
                      : new Date(activity.timestamp),
                    identities: objectMember.identities,
                    organizations: objectMember.organizations,
                    reach: member.reach,
                  },
                  dbObjectMember,
                  platform,
                  false,
                )

                if (!createActivity) {
                  // and use it's member id for the new activity
                  dbActivity.objectMemberId = dbObjectMember.id
                }

                objectMemberId = dbObjectMember.id
              } else {
                this.log.trace(
                  'We did not find a object member for the identity provided! Updating the one from db activity.',
                )
                // we did not find a member for the identity from the activity
                // which is weird since the memberId from the activity points to some member
                // that does not have the identity from the new activity
                // we should add the activity to the member
                // merge member data with the one from the activity and the one from the database
                // leave activity.memberId as is

                this.log.trace('Fetching dbActivity.objectMemberId object member data from db!')
                dbObjectMember = await txMemberRepo.findById(dbActivity.objectMemberId)
                this.log.trace('Updating object member data!')
                await txMemberService.update(
                  dbObjectMember.id,
                  tenantId,
                  onboarding,
                  segmentId,
                  integrationId,
                  {
                    attributes: objectMember.attributes,
                    joinedAt: objectMember.joinedAt
                      ? new Date(objectMember.joinedAt)
                      : new Date(activity.timestamp),
                    identities: objectMember.identities,
                    organizations: objectMember.organizations,
                    reach: member.reach,
                  },
                  dbObjectMember,
                  platform,
                  false,
                )

                objectMemberId = dbActivity.objectMemberId
              }
            }
          }

          if (!createActivity) {
            this.log.trace('Fetching activity organizations affiliation...')
            organizationId = await txMemberAffiliationService.findAffiliation(
              dbActivity.memberId,
              segmentId,
              dbActivity.timestamp,
            )

            // just update the activity now
            this.log.trace('Updating activity.')
            await txActivityService.update(
              dbActivity.id,
              tenantId,
              onboarding,
              segmentId,
              {
                type: activity.type,
                isContribution: activity.isContribution,
                score: activity.score,
                sourceId: activity.sourceId,
                sourceParentId: activity.sourceParentId,
                memberId: dbActivity.memberId,
                username,
                objectMemberId,
                objectMemberUsername,
                attributes: activity.attributes || {},
                body: activity.body,
                title: activity.title,
                channel: activity.channel,
                url: activity.url,
                organizationId,
                platform:
                  platform === PlatformType.GITHUB && dbActivity.platform === PlatformType.GIT
                    ? PlatformType.GITHUB
                    : (dbActivity.platform as PlatformType),
              },
              dbActivity,
              {
                isBot: memberIsBot ?? false,
                isTeamMember: memberIsTeamMember ?? false,
              },
              false,
            )
          }

          // release lock for member inside activity exists - this migth be redundant, but just in case
        } else {
          this.log.trace('We did not find an existing activity. Creating a new one.')
          createActivity = true

          // we don't have the activity yet in the database
          // check if we have a member for the identity from the activity
          this.log.trace({ platform, username }, 'Finding activity member by username from db.')
          let dbMember = await txMemberRepo.findMemberByUsername(
            tenantId,
            segmentId,
            platform,
            username,
          )

          // try to find a member by email if verified one is available
          if (!dbMember) {
            const emails = member.identities
              .filter((i) => i.verified && i.type === MemberIdentityType.EMAIL)
              .map((i) => i.value)

            if (emails.length > 0) {
              for (const email of emails) {
                this.log.trace({ email }, 'Finding activity member by email.')
                dbMember = await txMemberRepo.findMemberByEmail(tenantId, email)

                if (dbMember) {
                  break
                }
              }
            }
          }

          if (dbMember) {
            this.log.trace(
              { memberId: dbMember.id },
              'Found existing member. Updating member data.',
            )
            await txMemberService.update(
              dbMember.id,
              tenantId,
              onboarding,
              segmentId,
              integrationId,
              {
                attributes: member.attributes,
                joinedAt: member.joinedAt
                  ? new Date(member.joinedAt)
                  : new Date(activity.timestamp),
                identities: member.identities,
                organizations: member.organizations,
                reach: member.reach,
              },
              dbMember,
              platform,
              false,
            )
            memberId = dbMember.id
            // determine isBot and isTeamMember
            memberIsBot = (memberAttValue(MemberAttributeName.IS_BOT, dbMember) as boolean) ?? false
            memberIsTeamMember =
              (memberAttValue(MemberAttributeName.IS_TEAM_MEMBER, dbMember) as boolean) ?? false
          } else {
            this.log.trace(
              'We did not find a member for the identity provided! Creating a new one.',
            )
            memberId = await txMemberService.create(
              tenantId,
              onboarding,
              segmentId,
              integrationId,
              {
                displayName: member.displayName || username,
                attributes: member.attributes,
                joinedAt: member.joinedAt
                  ? new Date(member.joinedAt)
                  : new Date(activity.timestamp),
                identities: member.identities,
                organizations: member.organizations,
                reach: member.reach,
              },
              platform,
              false,
            )
          }
          // determine isBot and isTeamMember
          memberIsBot = (memberAttValue(MemberAttributeName.IS_BOT) as boolean) ?? false
          memberIsTeamMember =
            (memberAttValue(MemberAttributeName.IS_TEAM_MEMBER) as boolean) ?? false

          if (objectMember) {
            // we don't have the activity yet in the database
            // check if we have an object member for the identity from the activity
            this.log.trace(
              { platform, objectMemberUsername },
              'Finding existing db object member by username.',
            )
            const dbObjectMember = await txMemberRepo.findMemberByUsername(
              tenantId,
              segmentId,
              platform,
              objectMemberUsername,
            )
            if (dbObjectMember) {
              this.log.trace(
                { objectMemberId: dbObjectMember.id },
                'Found existing object member. Updating member data.',
              )
              await txMemberService.update(
                dbObjectMember.id,
                tenantId,
                onboarding,
                segmentId,
                integrationId,
                {
                  attributes: objectMember.attributes,
                  joinedAt: objectMember.joinedAt
                    ? new Date(objectMember.joinedAt)
                    : new Date(activity.timestamp),
                  identities: objectMember.identities,
                  organizations: objectMember.organizations,
                  reach: member.reach,
                },
                dbObjectMember,
                platform,
                false,
              )
              objectMemberId = dbObjectMember.id
            } else {
              this.log.trace(
                'We did not find a member for the identity provided! Creating a new one.',
              )
              objectMemberId = await txMemberService.create(
                tenantId,
                onboarding,
                segmentId,
                integrationId,
                {
                  displayName: objectMember.displayName || username,
                  attributes: objectMember.attributes,
                  joinedAt: objectMember.joinedAt
                    ? new Date(objectMember.joinedAt)
                    : new Date(activity.timestamp),
                  identities: objectMember.identities,
                  organizations: objectMember.organizations,
                  reach: member.reach,
                },
                platform,
                false,
              )
            }
          }
        }

        const activityId = dbActivity?.id ?? generateUUIDv4()
        if (createActivity) {
          this.log.trace('Finding activity organization affiliation.')
          organizationId = await txMemberAffiliationService.findAffiliation(
            memberId,
            segmentId,
            activity.timestamp,
          )

          this.log.trace('Creating activity.')
          await txActivityService.create(
            tenantId,
            segmentId,
            {
              id: activityId,
              type: activity.type,
              platform,
              timestamp: new Date(activity.timestamp),
              sourceId: activity.sourceId,
              isContribution: activity.isContribution,
              score: activity.score,
              sourceParentId:
                platform === PlatformType.GITHUB &&
                activity.type === GithubActivityType.AUTHORED_COMMIT &&
                activity.sourceParentId
                  ? await findMatchingPullRequestNodeId(
                      this.qdbStore.connection(),
                      tenantId,
                      activity,
                    )
                  : activity.sourceParentId,
              memberId,
              username,
              objectMemberId,
              objectMemberUsername,
              attributes:
                platform === PlatformType.GITHUB &&
                activity.type === GithubActivityType.AUTHORED_COMMIT
                  ? await this.findMatchingGitActivityAttributes({
                      tenantId,
                      segmentId,
                      activity,
                      attributes: activity.attributes || {},
                    })
                  : activity.attributes || {},
              body: activity.body,
              title: activity.title,
              channel: activity.channel,
              url: activity.url,
              organizationId,
            },
            {
              isBot: memberIsBot ?? false,
              isTeamMember: memberIsTeamMember ?? false,
            },
          )
        }

        // if snowflake is enabled, we need to push attributes to matching github activity
        if (IS_GITHUB_SNOWFLAKE_ENABLED) {
          if (platform === PlatformType.GIT && activity.type === GitActivityType.AUTHORED_COMMIT) {
            this.log.trace('Pushing attributes to matching github activity.')
            await this.pushAttributesToMatchingGithubActivity({ tenantId, segmentId, activity })
          } else if (
            platform === PlatformType.GITHUB &&
            activity.type === GithubActivityType.PULL_REQUEST_OPENED
          ) {
            this.log.trace('Pushing PR sourceId to matching github commits.')
            await this.pushPRSourceIdToMatchingGithubCommits({ tenantId, activity })
          }
        }
      } finally {
        // release locks matter what
      }
    })

    if (memberId) {
      this.log.trace('Triggering member sync.')
      await this.searchSyncWorkerEmitter.triggerMemberSync(
        tenantId,
        memberId,
        onboarding,
        segmentId,
      )
    }
    if (objectMemberId) {
      this.log.trace('Triggering object member sync.')
      await this.searchSyncWorkerEmitter.triggerMemberSync(
        tenantId,
        objectMemberId,
        onboarding,
        segmentId,
      )
    }

    if (organizationId) {
      await this.redisClient.sAdd('organizationIdsForAggComputation', organizationId)
    }
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
    tenantId,
    segmentId,
    platform,
    activity,
  }: {
    tenantId: string
    segmentId: string
    platform: PlatformType
    activity: IActivityData
  }): Promise<IDbActivityCreateData | null> {
    const { rows } = await queryActivities(this.qdbStore.connection(), {
      tenantId,
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
    })

    if (rows.length > 0) {
      return rows[0]
    }

    return null
  }

  private async findMatchingGitActivityAttributes({
    tenantId,
    segmentId,
    activity,
    attributes,
  }: {
    tenantId: string
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
      tenantId,
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
    tenantId,
    segmentId,
    activity,
  }: {
    tenantId: string
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
      tenantId,
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

  private async pushPRSourceIdToMatchingGithubCommits({
    tenantId,
    activity,
  }: {
    tenantId: string
    activity: IActivityData
  }) {
    if (
      activity.platform !== PlatformType.GITHUB ||
      activity.type !== GithubActivityType.PULL_REQUEST_OPENED
    ) {
      return
    }

    const commits = await findCommitsForPRSha(
      this.qdbStore.connection(),
      tenantId,
      activity.attributes.sha as string,
    )

    await updateActivities(
      this.qdbStore.connection(),
      this.client,
      async () => ({
        sourceParentId: activity.sourceId,
      }),
      `id IN ($(commits))`,
      { commits },
    )
  }
}
