import { ActivityAutomationData } from '../../messageTypes'
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
import { IRepositoryOptions } from '../../../../../database/repositories/IRepositoryOptions'

/**
 * Helper function to check whether a single activity should be processed by automation
 * @param activityData Activity data
 * @param automation {AutomationData} Automation data
 */
export const shouldProcessActivity = (
  activityData: ActivityAutomationData,
  automation: AutomationData,
): boolean => {
  const settings = automation.settings as NewActivitySettings

  let process = true

  // check whether activity type matches
  if (settings.types && settings.types.length > 0) {
    if (!settings.types.includes(activityData.activityType)) {
      console.log(
        `Ignoring automation ${automation.id} - Activity ${activityData.activityId} type '${
          activityData.activityType
        }' does not match automation setting types: [${settings.types.join(', ')}]`,
      )
      process = false
    }
  }

  // check whether activity platform matches
  if (process && settings.platforms && settings.platforms.length > 0) {
    if (!settings.platforms.includes(activityData.platform)) {
      console.log(
        `Ignoring automation ${automation.id} - Activity ${activityData.activityId} platform '${
          activityData.platform
        }' does not match automation setting platforms: [${settings.platforms.join(', ')}]`,
      )
      process = false
    }
  }

  // check whether activity content contains any of the keywords
  if (process && settings.keywords && settings.keywords.length > 0) {
    const body = (activityData.body as string).toLowerCase()
    if (!settings.keywords.some((keyword) => body.includes(keyword.trim().toLowerCase()))) {
      console.log(
        `Ignoring automation ${automation.id} - Activity ${
          activityData.activityId
        } content does not match automation setting keywords: [${settings.keywords.join(', ')}]`,
      )
      process = false
    }
  }

  if (process && !settings.teamMemberActivities && activityData.isTeamMember) {
    console.log(
      `Ignoring automation ${automation.id} - Activity ${activityData.activityId} belongs to a team member!`,
    )
    process = false
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

async function loadActivityData(
  activityId: string,
  activity: any | undefined,
  context: IRepositoryOptions,
): Promise<any> {
  if (activity) return activity

  const activityData = await ActivityRepository.findById(activityId, context)
  return activityData
}

/**
 * Check whether this activity matches any automations for tenant.
 * If so emit automation process messages to NodeJS microservices SQS queue.
 *
 * @param tenantId tenant unique ID
 * @param activityData activity unique ID
 */
export default async (
  tenantId: string,
  activityAutomationData: ActivityAutomationData,
): Promise<void> => {
  // console.log(`New activity automation trigger detected with activity id: ${activityId}!`)

  const userContext = await getUserContext(tenantId)

  try {
    // check if relevant automations exists in this tenant
    const automations = await new AutomationRepository(userContext).findAll({
      trigger: AutomationTrigger.NEW_ACTIVITY,
      state: AutomationState.ACTIVE,
    })

    if (automations.length > 0) {
      console.log(`Found ${automations.length} automations to process!`)
      let activity: any | undefined
      let activityData: ActivityAutomationData =
        activityAutomationData.activityType !== undefined ? activityAutomationData : undefined

      if (activityData === undefined) {
        activity = loadActivityData(activityAutomationData.activityId, undefined, userContext)
        activityData = {
          activityId: activity.id,
          body: activity.body,
          activityType: activity.type,
          platform: activity.platform,
          isTeamMember: activity.member.attributes.isTeamMember
            ? activity.member.attributes.isTeamMember.custom
            : false,
        }
      }

      for (const automation of automations) {
        if (shouldProcessActivity(activityData, automation)) {
          console.log(
            `Activity ${activityData.activityId} is being processed by automation ${automation.id}!`,
          )

          activity = await loadActivityData(activityData.activityId, activity, userContext)

          switch (automation.type) {
            case AutomationType.WEBHOOK:
              await sendWebhookProcessRequest(
                tenantId,
                automation.id,
                activity.id,
                prepareActivityPayload(activity),
              )
              break
            default:
              console.log(`ERROR: Automation type '${automation.type}' is not supported!`)
          }
        }
      }
    } else {
      // console.log(`No automations found for tenant ${tenantId} and new_activity trigger!`)
    }
  } catch (error) {
    console.log('Error while processing new activity automation trigger!', error)
    throw error
  }
}
