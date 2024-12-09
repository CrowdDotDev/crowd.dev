import vader from 'crowd-sentiment'
import isEqual from 'lodash.isequal'
import mergeWith from 'lodash.mergewith'

import {
  EDITION,
  escapeNullByte,
  generateUUIDv4,
  isObjectEmpty,
  singleOrDefault,
  trimUtf8ToMaxByteLength,
} from '@crowd/common'
import { SearchSyncWorkerEmitter } from '@crowd/common_services'
import { insertActivities, queryActivities } from '@crowd/data-access-layer'
import { DbStore, arePrimitivesDbEqual } from '@crowd/data-access-layer/src/database'
import {
  IDbActivity,
  IDbActivityUpdateData,
} from '@crowd/data-access-layer/src/old/apps/data_sink_worker/repo/activity.data'
import GithubReposRepository from '@crowd/data-access-layer/src/old/apps/data_sink_worker/repo/githubRepos.repo'
import GitlabReposRepository from '@crowd/data-access-layer/src/old/apps/data_sink_worker/repo/gitlabRepos.repo'
import IntegrationRepository from '@crowd/data-access-layer/src/old/apps/data_sink_worker/repo/integration.repo'
import { IDbMember } from '@crowd/data-access-layer/src/old/apps/data_sink_worker/repo/member.data'
import MemberRepository from '@crowd/data-access-layer/src/old/apps/data_sink_worker/repo/member.repo'
import RequestedForErasureMemberIdentitiesRepository from '@crowd/data-access-layer/src/old/apps/data_sink_worker/repo/requestedForErasureMemberIdentities.repo'
import SettingsRepository from '@crowd/data-access-layer/src/old/apps/data_sink_worker/repo/settings.repo'
import { DEFAULT_ACTIVITY_TYPE_SETTINGS } from '@crowd/integrations'
import { Logger, LoggerBase, getChildLogger } from '@crowd/logging'
import { RedisClient } from '@crowd/redis'
import { Client as TemporalClient, WorkflowIdReusePolicy } from '@crowd/temporal'
import {
  Edition,
  IActivityData,
  ISentimentAnalysisResult,
  MemberAttributeName,
  MemberIdentityType,
  PlatformType,
  TemporalWorkflowId,
} from '@crowd/types'

import { TEMPORAL_CONFIG } from '../conf'

import { IActivityCreateData, IActivityUpdateData, ISentimentActivityInput } from './activity.data'
import MemberService from './member.service'
import MemberAffiliationService from './memberAffiliation.service'

export class SuppressedActivityError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'SuppressedActivityError'
  }
}

export default class ActivityService extends LoggerBase {
  constructor(
    private readonly pgStore: DbStore,
    private readonly qdbStore: DbStore,
    private readonly searchSyncWorkerEmitter: SearchSyncWorkerEmitter,
    private readonly redisClient: RedisClient,
    private readonly temporal: TemporalClient,
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
          await insertActivities([
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

      if (EDITION !== Edition.LFX) {
        try {
          const handle = await this.temporal.workflow.start('processNewActivityAutomation', {
            workflowId: `${TemporalWorkflowId.NEW_ACTIVITY_AUTOMATION}/${id}`,
            taskQueue: TEMPORAL_CONFIG().automationsTaskQueue,
            workflowIdReusePolicy: WorkflowIdReusePolicy.WORKFLOW_ID_REUSE_POLICY_REJECT_DUPLICATE,
            retry: {
              maximumAttempts: 100,
            },
            args: [
              {
                tenantId,
                activityId: id,
              },
            ],
            searchAttributes: {
              TenantId: [tenantId],
            },
          })
          this.log.info(
            { workflowId: handle.workflowId },
            'Started temporal workflow to process new activity automation!',
          )
        } catch (err) {
          this.log.error(
            err,
            'Error while starting temporal workflow to process new activity automation!',
          )
          throw err
        }
      }

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
            await insertActivities([
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

    try {
      this.log.debug({ tenantId, integrationId, platform }, 'Processing activity.')

      if (!activity.username && !activity.member) {
        this.log.error(
          { integrationId, platform, activity },
          'Activity does not have a username or member.',
        )
        throw new Error('Activity does not have a username or member.')
      }

      let member = activity.member

      const erasureRepo = new RequestedForErasureMemberIdentitiesRepository(this.pgStore, this.log)

      const anonymizedMember = await erasureRepo.anonymizeMemberIfRequested(activity.member)

      if (anonymizedMember) {
        member = anonymizedMember

        this.log.warn(
          { memberIdentities: member.identities },
          'Member has identities that were requested to be erased by the user, so anonymized instead!',
        )
      }

      let username = activity.username

      // check if activity.username was requested to be erased
      const anonymizeUsernameIfRequested = await erasureRepo.getAnonymizationRequest({
        value: activity.username,
        platform,
        type: MemberIdentityType.USERNAME,
        hashValue: true,
      })

      if (anonymizeUsernameIfRequested) {
        username = anonymizeUsernameIfRequested.value
        // explicitly set the displayName to the anonymized username
        member.displayName = username
      }

      if (!username) {
        const identity = singleOrDefault(
          member.identities,
          (i) => i.platform === platform && i.type === MemberIdentityType.USERNAME,
        )
        if (!identity) {
          if (platform === PlatformType.JIRA) {
            throw new SuppressedActivityError(
              `Activity's member does not have an identity for the platform: ${platform}!`,
            )
          } else {
            this.log.error(
              "Activity's member does not have an identity for the platform. Suppressing it!",
            )
            throw new Error(
              `Activity's member does not have an identity for the platform: ${platform}!`,
            )
          }
        }

        username = identity.value
      }

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

      let objectMember = activity.objectMember

      const anonymizeObjectMemberIfRequested =
        await erasureRepo.anonymizeMemberIfRequested(objectMember)

      if (anonymizeObjectMemberIfRequested) {
        objectMember = anonymizeObjectMemberIfRequested

        this.log.warn(
          { objectMemberIdentities: objectMember.identities },
          'Object member has identities that were requested to be erased by the user, so anonymized instead!',
        )
      }

      let objectMemberUsername = activity.objectMemberUsername

      const anonymizeObjectMemberUsernameIfRequested = await erasureRepo.getAnonymizationRequest({
        value: objectMemberUsername,
        platform,
        type: MemberIdentityType.USERNAME,
        hashValue: true,
      })

      if (anonymizeObjectMemberUsernameIfRequested) {
        objectMemberUsername = anonymizeObjectMemberUsernameIfRequested.value
        // explicitly set the displayName to the anonymized username
        objectMember.displayName = objectMemberUsername
      }

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
            this.log,
          )
          const txIntegrationRepo = new IntegrationRepository(txStore, this.log)
          const txMemberAffiliationService = new MemberAffiliationService(txStore, this.log)
          const txGithubReposRepo = new GithubReposRepository(txStore, this.log)
          const txGitlabReposRepo = new GitlabReposRepository(txStore, this.log)

          segmentId = providedSegmentId
          if (!segmentId) {
            const dbIntegration = await txIntegrationRepo.findById(integrationId)
            const repoSegmentId = await txGithubReposRepo.findSegmentForRepo(
              tenantId,
              activity.channel,
            )
            const gitlabRepoSegmentId = await txGitlabReposRepo.findSegmentForRepo(
              tenantId,
              activity.channel,
            )

            if (platform === PlatformType.GITLAB && gitlabRepoSegmentId) {
              segmentId = gitlabRepoSegmentId
            } else if (platform === PlatformType.GITHUB && repoSegmentId) {
              segmentId = repoSegmentId
            } else {
              segmentId = dbIntegration.segmentId
            }
          }

          // find existing activity
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
              memberIsBot =
                (memberAttValue(MemberAttributeName.IS_BOT, dbMember) as boolean) ?? false
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

              dbMember = await txMemberRepo.findById(dbActivity.memberId)
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
              memberIsBot =
                (memberAttValue(MemberAttributeName.IS_BOT, dbMember) as boolean) ?? false
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

                  dbObjectMember = await txMemberRepo.findById(dbActivity.objectMemberId)
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
              organizationId = await txMemberAffiliationService.findAffiliation(
                dbActivity.memberId,
                segmentId,
                dbActivity.timestamp,
              )

              // just update the activity now
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
                  dbMember = await txMemberRepo.findMemberByEmail(tenantId, email)

                  if (dbMember) {
                    break
                  }
                }
              }
            }

            if (dbMember) {
              this.log.trace({ memberId: dbMember.id }, 'Found existing member.')
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
              memberIsBot =
                (memberAttValue(MemberAttributeName.IS_BOT, dbMember) as boolean) ?? false
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

              // If this was an anonymized member, update the erasure table with the new memberId
              if (anonymizedMember) {
                for (const identity of member.identities) {
                  await erasureRepo.updateErasureRequestMemberId(identity, memberId)
                }
              }
            }
            // determine isBot and isTeamMember
            memberIsBot = (memberAttValue(MemberAttributeName.IS_BOT) as boolean) ?? false
            memberIsTeamMember =
              (memberAttValue(MemberAttributeName.IS_TEAM_MEMBER) as boolean) ?? false

            if (objectMember) {
              // we don't have the activity yet in the database
              // check if we have an object member for the identity from the activity

              const dbObjectMember = await txMemberRepo.findMemberByUsername(
                tenantId,
                segmentId,
                platform,
                objectMemberUsername,
              )
              if (dbObjectMember) {
                this.log.trace(
                  { objectMemberId: dbObjectMember.id },
                  'Found existing object member.',
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
                    reach: objectMember.reach,
                  },
                  platform,
                  false,
                )

                // If this was an anonymized object member, update the erasure table with the new memberId
                if (anonymizeObjectMemberIfRequested) {
                  for (const identity of objectMember.identities) {
                    await erasureRepo.updateErasureRequestMemberId(identity, objectMemberId)
                  }
                }
              }
            }
          }

          if (createActivity) {
            organizationId = await txMemberAffiliationService.findAffiliation(
              memberId,
              segmentId,
              activity.timestamp,
            )

            await txActivityService.create(
              tenantId,
              segmentId,
              {
                id: dbActivity?.id ?? generateUUIDv4(),
                type: activity.type,
                platform,
                timestamp: new Date(activity.timestamp),
                sourceId: activity.sourceId,
                isContribution: activity.isContribution,
                score: activity.score,
                sourceParentId: activity.sourceParentId,
                memberId,
                username,
                objectMemberId,
                objectMemberUsername,
                attributes: activity.attributes || {},
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
        } finally {
          // release locks matter what
        }
      })

      if (memberId) {
        await this.searchSyncWorkerEmitter.triggerMemberSync(
          tenantId,
          memberId,
          onboarding,
          segmentId,
        )
      }
      if (objectMemberId) {
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
    } catch (err) {
      if (!(err instanceof SuppressedActivityError)) {
        this.log.error(err, 'Error while processing an activity!')
      }
      throw err
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
}
