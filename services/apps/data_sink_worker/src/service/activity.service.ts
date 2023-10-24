import { IDbActivity, IDbActivityUpdateData } from '../repo/activity.data'
import MemberRepository from '../repo/member.repo'
import { isObjectEmpty, singleOrDefault, escapeNullByte } from '@crowd/common'
import { DbStore, arePrimitivesDbEqual } from '@crowd/database'
import { Logger, LoggerBase, getChildLogger } from '@crowd/logging'
import { ISentimentAnalysisResult, getSentiment } from '@crowd/sentiment'
import { IActivityData, PlatformType } from '@crowd/types'
import ActivityRepository from '../repo/activity.repo'
import { IActivityCreateData, IActivityUpdateData } from './activity.data'
import MemberService from './member.service'
import mergeWith from 'lodash.mergewith'
import isEqual from 'lodash.isequal'
import { NodejsWorkerEmitter, SearchSyncWorkerEmitter } from '@crowd/sqs'
import SettingsRepository from './settings.repo'
import { ConversationService } from '@crowd/conversations'
import IntegrationRepository from '../repo/integration.repo'
import GithubReposRepository from '../repo/githubRepos.repo'
import MemberAffiliationService from './memberAffiliation.service'
import { RedisClient } from '@crowd/redis'
import { acquireLock, releaseLock } from '@crowd/redis'

const MEMBER_LOCK_EXPIRE_AFTER = 10 * 60 // 10 minutes
const MEMBER_LOCK_TIMEOUT_AFTER = 5 * 60 // 5 minutes

export default class ActivityService extends LoggerBase {
  private readonly conversationService: ConversationService

  constructor(
    private readonly store: DbStore,
    private readonly nodejsWorkerEmitter: NodejsWorkerEmitter,
    private readonly searchSyncWorkerEmitter: SearchSyncWorkerEmitter,
    private readonly redisClient: RedisClient,
    parentLog: Logger,
  ) {
    super(parentLog)

    this.conversationService = new ConversationService(store, this.log)
  }

  public async create(
    tenantId: string,
    segmentId: string,
    activity: IActivityCreateData,
    fireSync = true,
  ): Promise<string> {
    try {
      this.log.debug('Creating an activity.')

      const sentiment = await getSentiment(`${activity.body || ''} ${activity.title || ''}`.trim())

      const id = await this.store.transactionally(async (txStore) => {
        const txRepo = new ActivityRepository(txStore, this.log)
        const txSettingsRepo = new SettingsRepository(txStore, this.log)

        await txSettingsRepo.createActivityType(
          tenantId,
          activity.platform as PlatformType,
          activity.type,
        )

        if (activity.channel) {
          await txSettingsRepo.createActivityChannel(
            tenantId,
            segmentId,
            activity.platform,
            activity.channel,
          )
        }

        const id = await txRepo.create(tenantId, segmentId, {
          type: activity.type,
          timestamp: activity.timestamp.toISOString(),
          platform: activity.platform,
          isContribution: activity.isContribution,
          score: activity.score,
          sourceId: activity.sourceId,
          sourceParentId: activity.sourceParentId,
          tenantId,
          memberId: activity.memberId,
          username: activity.username,
          sentiment,
          attributes: activity.attributes || {},
          body: escapeNullByte(activity.body),
          title: escapeNullByte(activity.title),
          channel: activity.channel,
          url: activity.url,
          organizationId: activity.organizationId,
        })

        return id
      })
      await this.nodejsWorkerEmitter.processAutomationForNewActivity(tenantId, id, segmentId)
      const affectedIds = await this.conversationService.processActivity(tenantId, segmentId, id)

      if (fireSync) {
        await this.searchSyncWorkerEmitter.triggerMemberSync(tenantId, activity.memberId)
        await this.searchSyncWorkerEmitter.triggerActivitySync(tenantId, id)
      }

      if (affectedIds.length > 0) {
        for (const affectedId of affectedIds.filter((i) => i !== id)) {
          await this.searchSyncWorkerEmitter.triggerActivitySync(tenantId, affectedId)
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
    segmentId: string,
    activity: IActivityUpdateData,
    original: IDbActivity,
    fireSync = true,
  ): Promise<void> {
    try {
      const updated = await this.store.transactionally(async (txStore) => {
        const txRepo = new ActivityRepository(txStore, this.log)
        const txSettingsRepo = new SettingsRepository(txStore, this.log)

        const toUpdate = await this.mergeActivityData(activity, original)

        if (toUpdate.type) {
          await txSettingsRepo.createActivityType(
            tenantId,
            original.platform as PlatformType,
            toUpdate.type,
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
          await txRepo.update(id, tenantId, segmentId, {
            type: toUpdate.type || original.type,
            isContribution: toUpdate.isContribution || original.isContribution,
            score: toUpdate.score || original.score,
            sourceId: toUpdate.sourceId || original.sourceId,
            sourceParentId: toUpdate.sourceParentId || original.sourceParentId,
            memberId: toUpdate.memberId || original.memberId,
            username: toUpdate.username || original.username,
            sentiment: toUpdate.sentiment || original.sentiment,
            attributes: toUpdate.attributes || original.attributes,
            body: escapeNullByte(toUpdate.body || original.body),
            title: escapeNullByte(toUpdate.title || original.title),
            channel: toUpdate.channel || original.channel,
            url: toUpdate.url || original.url,
            organizationId: toUpdate.organizationId || original.organizationId,
          })

          return true
        } else {
          this.log.debug({ activityId: id }, 'No changes to update in an activity.')
          return false
        }
      })

      if (updated) {
        await this.conversationService.processActivity(tenantId, segmentId, id)

        if (fireSync) {
          await this.searchSyncWorkerEmitter.triggerMemberSync(tenantId, activity.memberId)
          await this.searchSyncWorkerEmitter.triggerActivitySync(tenantId, id)
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
      sentiment = getSentiment(`${body || ''} ${title || ''}`.trim())
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
    }
  }

  public async processActivity(
    tenantId: string,
    integrationId: string,
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
      this.log.debug('Processing activity.')

      if (!activity.username && !activity.member) {
        this.log.error(
          { integrationId, platform, activity },
          'Activity does not have a username or member.',
        )
        throw new Error('Activity does not have a username or member.')
      }

      let username = activity.username
      if (!username) {
        const identity = singleOrDefault(activity.member.identities, (i) => i.platform === platform)
        if (!identity) {
          this.log.error("Activity's member does not have an identity for the platform.")
          throw new Error(
            `Activity's member does not have an identity for the platform: ${platform}!`,
          )
        }

        username = identity.username
      }

      let member = activity.member
      if (!member) {
        member = {
          identities: [
            {
              platform,
              username,
            },
          ],
        }
      }

      let objectMemberUsername = activity.objectMemberUsername
      let objectMember = activity.objectMember

      if (objectMember && !objectMemberUsername) {
        const identity = singleOrDefault(objectMember.identities, (i) => i.platform === platform)
        if (!identity) {
          this.log.error("Activity's object member does not have an identity for the platform.")
          throw new Error(
            `Activity's object member does not have an identity for the platform: ${platform}!`,
          )
        }

        objectMemberUsername = identity.username
      } else if (objectMemberUsername && !objectMember) {
        objectMember = {
          identities: [
            {
              platform,
              username: objectMemberUsername,
            },
          ],
        }
      }

      let memberId: string
      let objectMemberId: string | undefined
      let activityId: string

      await this.store.transactionally(async (txStore) => {
        let segmentId: string
        try {
          const txRepo = new ActivityRepository(txStore, this.log)
          const txMemberRepo = new MemberRepository(txStore, this.log)
          const txMemberService = new MemberService(
            txStore,
            this.nodejsWorkerEmitter,
            this.searchSyncWorkerEmitter,
            this.log,
          )
          const txActivityService = new ActivityService(
            txStore,
            this.nodejsWorkerEmitter,
            this.searchSyncWorkerEmitter,
            this.redisClient,
            this.log,
          )
          const txIntegrationRepo = new IntegrationRepository(txStore, this.log)
          const txMemberAffiliationService = new MemberAffiliationService(txStore, this.log)
          const txGithubReposRepo = new GithubReposRepository(txStore, this.log)

          segmentId = providedSegmentId
          if (!segmentId) {
            const dbIntegration = await txIntegrationRepo.findById(integrationId)
            const repoSegmentId = await txGithubReposRepo.findSegmentForRepo(
              tenantId,
              activity.channel,
            )
            segmentId =
              platform === PlatformType.GITHUB && repoSegmentId
                ? repoSegmentId
                : dbIntegration.segmentId
          }

          // find existing activity
          const dbActivity = await txRepo.findExisting(tenantId, segmentId, activity.sourceId)

          let createActivity = false

          if (dbActivity) {
            this.log.trace({ activityId: dbActivity.id }, 'Found existing activity. Updating it.')
            // process member data

            // acquiring lock for member inside activity exists
            await acquireLock(
              this.redisClient,
              `member:processing:${tenantId}:${segmentId}:${platform}:${username}`,
              'check-member-inside-activity-exists',
              MEMBER_LOCK_EXPIRE_AFTER,
              MEMBER_LOCK_TIMEOUT_AFTER,
            )

            let dbMember = await txMemberRepo.findMember(tenantId, segmentId, platform, username)
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

                // delete activity
                await txRepo.delete(dbActivity.id)
                await this.searchSyncWorkerEmitter.triggerRemoveActivity(tenantId, dbActivity.id)
                createActivity = true
              }

              // update the member
              await txMemberService.update(
                dbMember.id,
                tenantId,
                segmentId,
                integrationId,
                {
                  attributes: member.attributes,
                  emails: member.emails || [],
                  joinedAt: member.joinedAt
                    ? new Date(member.joinedAt)
                    : new Date(activity.timestamp),
                  weakIdentities: member.weakIdentities,
                  identities: member.identities,
                  organizations: member.organizations,
                },
                dbMember,
                false,
                async () =>
                  await releaseLock(
                    this.redisClient,
                    `member:processing:${tenantId}:${segmentId}:${platform}:${username}`,
                    'check-member-inside-activity-exists',
                  ),
              )

              if (!createActivity) {
                // and use it's member id for the new activity
                dbActivity.memberId = dbMember.id
              }

              memberId = dbMember.id
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
                segmentId,
                integrationId,
                {
                  attributes: member.attributes,
                  emails: member.emails || [],
                  joinedAt: member.joinedAt
                    ? new Date(member.joinedAt)
                    : new Date(activity.timestamp),
                  weakIdentities: member.weakIdentities,
                  identities: member.identities,
                  organizations: member.organizations,
                },
                dbMember,
                false,
                async () =>
                  await releaseLock(
                    this.redisClient,
                    `member:processing:${tenantId}:${segmentId}:${platform}:${username}`,
                    'check-member-inside-activity-exists',
                  ),
              )

              memberId = dbActivity.memberId
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
                let dbObjectMember = await txMemberRepo.findMember(
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

                    // delete activity
                    await txRepo.delete(dbActivity.id)
                    await this.searchSyncWorkerEmitter.triggerRemoveActivity(
                      tenantId,
                      dbActivity.id,
                    )
                    createActivity = true
                  }

                  // update the member
                  await txMemberService.update(
                    dbObjectMember.id,
                    tenantId,
                    segmentId,
                    integrationId,
                    {
                      attributes: objectMember.attributes,
                      emails: objectMember.emails || [],
                      joinedAt: objectMember.joinedAt
                        ? new Date(objectMember.joinedAt)
                        : new Date(activity.timestamp),
                      weakIdentities: objectMember.weakIdentities,
                      identities: objectMember.identities,
                      organizations: objectMember.organizations,
                    },
                    dbObjectMember,
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
                    segmentId,
                    integrationId,
                    {
                      attributes: objectMember.attributes,
                      emails: objectMember.emails || [],
                      joinedAt: objectMember.joinedAt
                        ? new Date(objectMember.joinedAt)
                        : new Date(activity.timestamp),
                      weakIdentities: objectMember.weakIdentities,
                      identities: objectMember.identities,
                      organizations: objectMember.organizations,
                    },
                    dbObjectMember,
                    false,
                  )

                  objectMemberId = dbActivity.objectMemberId
                }
              }
            }

            if (!createActivity) {
              const organizationId = await txMemberAffiliationService.findAffiliation(
                dbActivity.memberId,
                segmentId,
                dbActivity.timestamp,
              )

              // just update the activity now
              await txActivityService.update(
                dbActivity.id,
                tenantId,
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
                },
                dbActivity,
                false,
              )

              activityId = dbActivity.id
            }

            // release lock for member inside activity exists - this migth be redundant, but just in case
          } else {
            this.log.trace('We did not find an existing activity. Creating a new one.')
            createActivity = true

            // we don't have the activity yet in the database
            // check if we have a member for the identity from the activity
            const dbMember = await txMemberRepo.findMember(tenantId, segmentId, platform, username)
            if (dbMember) {
              this.log.trace({ memberId: dbMember.id }, 'Found existing member.')
              await txMemberService.update(
                dbMember.id,
                tenantId,
                segmentId,
                integrationId,
                {
                  attributes: member.attributes,
                  emails: member.emails || [],
                  joinedAt: member.joinedAt
                    ? new Date(member.joinedAt)
                    : new Date(activity.timestamp),
                  weakIdentities: member.weakIdentities,
                  identities: member.identities,
                  organizations: member.organizations,
                },
                dbMember,
                false,
              )
              memberId = dbMember.id
            } else {
              this.log.trace(
                'We did not find a member for the identity provided! Creating a new one.',
              )
              memberId = await txMemberService.create(
                tenantId,
                segmentId,
                integrationId,
                {
                  displayName: member.displayName || username,
                  attributes: member.attributes,
                  emails: member.emails || [],
                  joinedAt: member.joinedAt
                    ? new Date(member.joinedAt)
                    : new Date(activity.timestamp),
                  weakIdentities: member.weakIdentities,
                  identities: member.identities,
                  organizations: member.organizations,
                },
                false,
              )
            }

            if (objectMember) {
              // we don't have the activity yet in the database
              // check if we have an object member for the identity from the activity

              const dbObjectMember = await txMemberRepo.findMember(
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
                  segmentId,
                  integrationId,
                  {
                    attributes: objectMember.attributes,
                    emails: objectMember.emails || [],
                    joinedAt: objectMember.joinedAt
                      ? new Date(objectMember.joinedAt)
                      : new Date(activity.timestamp),
                    weakIdentities: objectMember.weakIdentities,
                    identities: objectMember.identities,
                    organizations: objectMember.organizations,
                  },
                  dbObjectMember,
                  false,
                )
                objectMemberId = dbObjectMember.id
              } else {
                this.log.trace(
                  'We did not find a member for the identity provided! Creating a new one.',
                )
                objectMemberId = await txMemberService.create(
                  tenantId,
                  segmentId,
                  integrationId,
                  {
                    displayName: objectMember.displayName || username,
                    attributes: objectMember.attributes,
                    emails: objectMember.emails || [],
                    joinedAt: objectMember.joinedAt
                      ? new Date(objectMember.joinedAt)
                      : new Date(activity.timestamp),
                    weakIdentities: objectMember.weakIdentities,
                    identities: objectMember.identities,
                    organizations: objectMember.organizations,
                  },
                  false,
                )
              }
            }
          }

          if (createActivity) {
            const organizationId = await txMemberAffiliationService.findAffiliation(
              memberId,
              segmentId,
              activity.timestamp,
            )

            activityId = await txActivityService.create(
              tenantId,
              segmentId,
              {
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
              false,
            )
          }
        } finally {
          // release locks matter what
          await releaseLock(
            this.redisClient,
            `member:processing:${tenantId}:${platform}:${username}`,
            'check-member-inside-activity-exists',
          )
        }
      })

      await this.searchSyncWorkerEmitter.triggerMemberSync(tenantId, memberId)
      if (objectMemberId) {
        await this.searchSyncWorkerEmitter.triggerMemberSync(tenantId, objectMemberId)
      }
      if (activityId) {
        await this.searchSyncWorkerEmitter.triggerActivitySync(tenantId, activityId)
      }
    } catch (err) {
      this.log.error(err, 'Error while processing an activity!')
      throw err
    }
  }
}
