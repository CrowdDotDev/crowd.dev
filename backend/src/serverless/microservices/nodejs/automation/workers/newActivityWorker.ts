import { getServiceChildLogger } from '@crowd/logging'
import getUserContext from '../../../../../database/utils/getUserContext'
import ActivityRepository from '../../../../../database/repositories/activityRepository'
import AutomationRepository from '../../../../../database/repositories/automationRepository'
import {
  AutomationData,
  AutomationState,
  AutomationTrigger,
  AutomationType,
  NewActivitySettings,
} from '../../../../../types/automationTypes'
import { sendWebhookProcessRequest } from './util'
import { prepareMemberPayload } from './newMemberWorker'
import AutomationExecutionRepository from '../../../../../database/repositories/automationExecutionRepository'
import SequelizeRepository from '../../../../../database/repositories/sequelizeRepository'
import MemberRepository from '../../../../../database/repositories/memberRepository'

const log = getServiceChildLogger('newActivityWorker')

/**
 * Helper function to check whether a single activity should be processed by automation
 * @param activity Activity data
 * @param automation {AutomationData} Automation data
 */
export const shouldProcessActivity = async (
  activity: any,
  automation: AutomationData,
): Promise<boolean> => {
  const settings = automation.settings as NewActivitySettings

  let process = true

  // check whether activity type matches
  if (settings.types && settings.types.length > 0) {
    if (!settings.types.includes(activity.type)) {
      log.warn(
        `Ignoring automation ${automation.id} - Activity ${activity.id} type '${
          activity.type
        }' does not match automation setting types: [${settings.types.join(', ')}]`,
      )
      process = false
    }
  }

  // check whether activity platform matches
  if (process && settings.platforms && settings.platforms.length > 0) {
    if (!settings.platforms.includes(activity.platform)) {
      log.warn(
        `Ignoring automation ${automation.id} - Activity ${activity.id} platform '${
          activity.platform
        }' does not match automation setting platforms: [${settings.platforms.join(', ')}]`,
      )
      process = false
    }
  }

  // check whether activity content contains any of the keywords
  if (process && settings.keywords && settings.keywords.length > 0) {
    const body = (activity.body as string).toLowerCase()
    if (!settings.keywords.some((keyword) => body.includes(keyword.trim().toLowerCase()))) {
      log.warn(
        `Ignoring automation ${automation.id} - Activity ${
          activity.id
        } content does not match automation setting keywords: [${settings.keywords.join(', ')}]`,
      )
      process = false
    }
  }

  if (
    process &&
    !settings.teamMemberActivities &&
    activity.member.attributes.isTeamMember &&
    activity.member.attributes.isTeamMember.default
  ) {
    log.warn(
      `Ignoring automation ${automation.id} - Activity ${activity.id} belongs to a team member!`,
    )
    process = false
  }

  if (activity?.member?.attributes?.isBot && activity?.member?.attributes?.isBot.default) {
    log.warn(
      `Ignoring automation ${automation.id} - Activity ${activity.id} belongs to a bot, cannot be processed automaticaly!`,
    )
    process = false
  }

  if (process) {
    const userContext = await SequelizeRepository.getDefaultIRepositoryOptions()
    const repo = new AutomationExecutionRepository(userContext)

    const hasAlreadyBeenTriggered = await repo.hasAlreadyBeenTriggered(automation.id, activity.id)
    if (hasAlreadyBeenTriggered) {
      log.warn(
        `Ignoring automation ${automation.id} - Activity ${activity.id} was already processed!`,
      )
      process = false
    }
  }

  return process
}

/**
 * Return a cleaned up copy of the activity that contains only data that is relevant for automation.
 *
 * @param activity Activity data as it came from the repository layer
 * @returns a cleaned up payload to use with automation
 */
export const prepareActivityPayload = (activity: any): any => {
  const copy = { ...activity }

  delete copy.importHash
  delete copy.updatedAt
  delete copy.updatedById
  delete copy.deletedAt
  if (copy.member) {
    copy.member = prepareMemberPayload(copy.member)
  }
  if (copy.parent) {
    copy.parent = prepareActivityPayload(copy.parent)
  }

  return copy
}

/**
 * Check whether this activity matches any automations for tenant.
 * If so emit automation process messages to NodeJS microservices SQS queue.
 *
 * @param tenantId tenant unique ID
 * @param activityId activity unique ID
 * @param activityData activity data
 */
export default async (tenantId: string, activityId: string, segmentId: string): Promise<void> => {
  const userContext = await getUserContext(tenantId, null, [segmentId])

  try {
    // check if relevant automations exists in this tenant
    const automations = await new AutomationRepository(userContext).findAll({
      trigger: AutomationTrigger.NEW_ACTIVITY,
      state: AutomationState.ACTIVE,
    })

    if (automations.length > 0) {
      log.info(`Found ${automations.length} automations to process!`)
      let activity = await ActivityRepository.findById(activityId, userContext)

      if (activity.member?.id) {
        const member = await MemberRepository.findById(activity.member.id, userContext)
        activity = {
          ...activity,
          member,
          engagement: member?.score || 0,
        }
      }

      for (const automation of automations) {
        if (await shouldProcessActivity(activity, automation)) {
          log.info(`Activity ${activity.id} is being processed by automation ${automation.id}!`)

          switch (automation.type) {
            case AutomationType.WEBHOOK:
              await sendWebhookProcessRequest(
                tenantId,
                automation,
                activity.id,
                prepareActivityPayload(activity),
                AutomationType.WEBHOOK,
              )
              break
            case AutomationType.SLACK:
              await sendWebhookProcessRequest(
                tenantId,
                automation,
                activity.id,
                prepareActivityPayload(activity),
                AutomationType.SLACK,
              )
              break
            default:
              log.error(`ERROR: Automation type '${automation.type}' is not supported!`)
          }
        }
      }
    }
  } catch (error) {
    log.error(error, 'Error while processing new activity automation trigger!')
    throw error
  }
}
