import { IDbActivity, IDbActivityUpdateData } from '@/repo/activity.data'
import MemberRepository from '@/repo/member.repo'
import { isObjectEmpty, singleOrDefault } from '@crowd/common'
import { DbStore, arePrimitivesDbEqual } from '@crowd/database'
import { Logger, LoggerBase, getChildLogger } from '@crowd/logging'
import { ISentimentAnalysisResult, getSentiment } from '@crowd/sentiment'
import { IActivityData, PlatformType } from '@crowd/types'
import ActivityRepository from '@/repo/activity.repo'
import { IActivityCreateData, IActivityUpdateData } from './activity.data'
import MemberService from './member.service'
import mergeWith from 'lodash.mergewith'
import isEqual from 'lodash.isequal'
import { NodejsWorkerEmitter, SearchSyncWorkerEmitter } from '@crowd/sqs'
import SettingsRepository from './settings.repo'
import { ConversationService } from '@crowd/conversations'
import IntegrationRepository from '@/repo/integration.repo'

export default class ActivityService extends LoggerBase {
  private readonly conversationService: ConversationService

  constructor(
    private readonly store: DbStore,
    private readonly nodejsWorkerEmitter: NodejsWorkerEmitter,
    private readonly searchSyncWorkerEmitter: SearchSyncWorkerEmitter,
    parentLog: Logger,
  ) {
    super(parentLog)
    this.conversationService = new ConversationService(store, parentLog)
  }

  public async create(
    tenantId: string,
    segmentId: string,
    activity: IActivityCreateData,
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
          await txSettingsRepo.createActivityChannel(tenantId, activity.platform, activity.channel)
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
          body: activity.body,
          title: activity.title,
          channel: activity.channel,
          url: activity.url,
        })

        return id
      })

      await this.nodejsWorkerEmitter.processAutomationForNewActivity(tenantId, id)
      await this.conversationService.processActivity(tenantId, id)
      await this.searchSyncWorkerEmitter.triggerMemberSync(tenantId, activity.memberId)

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
          await txSettingsRepo.createActivityChannel(tenantId, original.platform, toUpdate.channel)
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
            body: toUpdate.body || original.body,
            title: toUpdate.title || original.title,
            channel: toUpdate.channel || original.channel,
            url: toUpdate.url || original.url,
          })

          return true
        } else {
          this.log.debug({ activityId: id }, 'No changes to update in an activity.')
          return false
        }
      })

      if (updated) {
        await this.conversationService.processActivity(tenantId, id)
        await this.searchSyncWorkerEmitter.triggerMemberSync(tenantId, activity.memberId)
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

    return {
      type,
      isContribution,
      score,
      sourceId,
      sourceParentId,
      memberId,
      username,
      sentiment: await sentiment,
      attributes,
      body,
      title,
      channel,
      url,
    }
  }

  public async processActivity(
    tenantId: string,
    integrationId: string,
    platform: PlatformType,
    activity: IActivityData,
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

      await this.store.transactionally(async (txStore) => {
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
          this.log,
        )
        const txIntegrationRepo = new IntegrationRepository(txStore, this.log)

        // find existing activity
        const dbActivity = await txRepo.findExisting(tenantId, activity.sourceId)

        const dbIntegration = await txIntegrationRepo.findById(integrationId)
        const segmentId = dbIntegration.segmentId

        let create = false
        let memberId: string

        if (dbActivity) {
          this.log.trace({ activityId: dbActivity.id }, 'Found existing activity. Updating it.')
          // process member data
          let dbMember = await txMemberRepo.findMember(tenantId, platform, username)
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
              memberId = dbMember.id
              create = true
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
              },
              dbMember,
              false,
            )

            if (!create) {
              // and use it's member id for the new activity
              dbActivity.memberId = dbMember.id
            }
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
              },
              dbMember,
              false,
            )
          }

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
              attributes: activity.attributes || {},
              body: activity.body,
              title: activity.title,
              channel: activity.channel,
              url: activity.url,
            },
            dbActivity,
          )
        } else {
          this.log.trace('We did not find an existing activity. Creating a new one.')

          // we don't have the activity yet in the database
          // check if we have a member for the identity from the activity
          const dbMember = await txMemberRepo.findMember(tenantId, platform, username)
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
              },
              false,
            )
          }

          create = true
        }

        if (create) {
          await txActivityService.create(tenantId, segmentId, {
            type: activity.type,
            platform,
            timestamp: new Date(activity.timestamp),
            sourceId: activity.sourceId,
            isContribution: activity.isContribution,
            score: activity.score,
            sourceParentId: activity.sourceParentId,
            memberId,
            username,
            attributes: activity.attributes || {},
            body: activity.body,
            title: activity.title,
            channel: activity.channel,
            url: activity.url,
          })
        }

        await this.searchSyncWorkerEmitter.triggerMemberSync(tenantId, memberId)
      })
    } catch (err) {
      this.log.error(err, 'Error while processing an activity!')
      throw err
    }
  }
}
