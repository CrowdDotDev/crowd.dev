import { IDbActivity } from '@/repo/activity.data'
import MemberRepository from '@/repo/member.repo'
import { singleOrDefault } from '@crowd/common'
import { DbStore } from '@crowd/database'
import { Logger, LoggerBase, getChildLogger } from '@crowd/logging'
import { IActivityData, PlatformType } from '@crowd/types'
import ActivityRepository from '../repo/activity.repo'
import { IActivityCreateData, IActivityUpdateData } from './activity.data'
import MemberService from './member.service'
import { DataSinkWorkerEmitter } from '@/queue'

export default class ActivityService extends LoggerBase {
  constructor(
    private readonly store: DbStore,
    private readonly dataSinkWorkerEmitter: DataSinkWorkerEmitter,
    parentLog: Logger,
  ) {
    super(parentLog)
  }

  public async create(activity: IActivityCreateData): Promise<string> {
    try {
      this.log.debug('Creating an activity.')
      throw new Error('Method not implemented.')
    } catch (err) {
      this.log.error(err, 'Error while creating an activity!')
      throw err
    }
  }

  public async update(
    id: string,
    activity: IActivityUpdateData,
    original?: IDbActivity,
  ): Promise<void> {
    try {
      this.log.debug({ activityId: id }, 'Updating an activity.')
      throw new Error('Method not implemented.')
    } catch (err) {
      this.log.error(err, { activityId: id }, 'Error while updating an activity!')
      throw err
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
        const txMemberService = new MemberService(txStore, this.log)
        const txActivityService = new ActivityService(txStore, this.dataSinkWorkerEmitter, this.log)

        // find existing activity
        const dbActivity = await txRepo.findExistingActivity(tenantId, activity.sourceId)

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
              await txRepo.deleteActivity(dbActivity.id)
              memberId = dbMember.id
              create = true
            }

            // update the member
            await txMemberService.update(dbMember.id, member, dbMember)

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
            await txMemberService.update(dbMember.id, member, dbMember)
          }

          // just update the activity now
          await txActivityService.update(
            dbActivity.id,
            {
              isContribution: activity.isContribution,
              score: activity.score,
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

          await this.dataSinkWorkerEmitter.calculateSentiment(tenantId, dbActivity.id)
        } else {
          this.log.trace('We did not find an existing activity. Creating a new one.')

          // we don't have the activity yet in the database
          // check if we have a member for the identity from the activity
          const dbMember = await txMemberRepo.findMember(tenantId, platform, username)
          if (dbMember) {
            this.log.trace({ memberId: dbMember.id }, 'Found existing member.')
            await txMemberService.update(dbMember.id, member, dbMember)
            memberId = dbMember.id
          } else {
            this.log.trace(
              'We did not find a member for the identity provided! Creating a new one.',
            )
            memberId = await txMemberService.create(member)
          }

          create = true
        }

        if (create) {
          const activityId = await txActivityService.create({
            type: activity.type,
            platform,
            timestamp: activity.timestamp,
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

          await this.dataSinkWorkerEmitter.calculateSentiment(tenantId, activityId)
        }
      })
    } catch (err) {
      this.log.error(err, 'Error while processing an activity!')
    }
  }
}
