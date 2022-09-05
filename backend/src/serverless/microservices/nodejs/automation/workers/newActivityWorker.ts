import getUserContext from '../../../../../database/utils/getUserContext'
import ActivityRepository from '../../../../../database/repositories/activityRepository'
import AutomationRepository from '../../../../../database/repositories/automationRepository'
import {
  AutomationState,
  AutomationTrigger,
  AutomationType,
  NewActivitySettings,
} from '../../../../../types/automationTypes'
import { sendWebhookProcessRequest } from './util'

/**
 * Check whether this activity matches any automations for tenant.
 * If so emit automation process messages to NodeJS microservices SQS queue.
 *
 * @param tenantId tenant unique ID
 * @param activityId activity unique ID
 */
export default async (tenantId: string, activityId: string): Promise<void> => {
  console.log(`New activity automation trigger detected with activity id: ${activityId}!`)

  const userContext = await getUserContext(tenantId)

  try {
    // check if relevant automations exists in this tenant
    const automations = await AutomationRepository.find(
      {
        trigger: AutomationTrigger.NEW_ACTIVITY,
        state: AutomationState.ACTIVE,
      },
      userContext,
    )

    if (automations.length > 0) {
      console.log(`Found ${automations.length} automations to process!`)
      const activityData = await ActivityRepository.findById(activityId, userContext)

      for (const automation of automations) {
        const settings = automation.settings as NewActivitySettings

        let process = true

        // check whether activity type matches
        if (settings.types.length > 0) {
          if (!settings.types.includes(activityData.type)) {
            console.log(
              `Ignoring automation ${automation.id} - Activity ${activityId} type '${
                activityData.type
              }' does not match automation setting types: [${settings.types.join(', ')}]`,
            )
            process = false
          }
        }

        // check whether activity platform matches
        if (process && settings.platforms.length > 0) {
          if (!settings.platforms.includes(activityData.platform)) {
            console.log(
              `Ignoring automation ${automation.id} - Activity ${activityId} platform '${
                activityData.platform
              }' does not match automation setting platforms: [${settings.platforms.join(', ')}]`,
            )
            process = false
          }
        }

        // check whether activity content contains any of the keywords
        if (process && settings.keywords.length > 0) {
          const body = (activityData.crowdInfo.body as string).toLowerCase()
          if (!settings.keywords.some((keyword) => body.includes(keyword.trim().toLowerCase()))) {
            console.log(
              `Ignoring automation ${
                automation.id
              } - Activity ${activityId} content does not match automation setting keywords: [${settings.keywords.join(
                ', ',
              )}]`,
            )
            process = false
          }
        }

        if (process && !settings.teamMemberActivities) {
          if (activityData.crowdInfo.teamMember) {
            console.log(
              `Ignoring automation ${automation.id} - Activity ${activityId} belongs to a team member!`,
            )
            process = false
          }
        }

        if (process) {
          console.log(`Activity ${activityId} is being processed by automation ${automation.id}!`)

          switch (automation.type) {
            case AutomationType.WEBHOOK:
              await sendWebhookProcessRequest(
                tenantId,
                automation.id,
                activityData.id,
                activityData,
              )
              break
            default:
              console.log(`ERROR: Automation type '${automation.type}' is not supported!`)
          }
        }
      }
    } else {
      console.log(`No automations found for tenant ${tenantId} and new_activity trigger!`)
    }
  } catch (error) {
    console.log('Error while processing new activity automation trigger!', error)
    throw error
  }
}
