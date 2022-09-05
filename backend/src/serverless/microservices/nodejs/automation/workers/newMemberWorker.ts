import getUserContext from '../../../../../database/utils/getUserContext'
import AutomationRepository from '../../../../../database/repositories/automationRepository'
import {
  AutomationState,
  AutomationTrigger,
  AutomationType,
  NewMemberSettings,
} from '../../../../../types/automationTypes'
import CommunityMemberRepository from '../../../../../database/repositories/communityMemberRepository'
import { sendWebhookProcessRequest } from './util'

/**
 * Check whether this member matches any automations for tenant.
 * If so emit automation process messages to NodeJS microservices SQS queue.
 *
 * @param tenantId tenant unique ID
 * @param memberId community member unique ID
 */
export default async (tenantId: string, memberId: string): Promise<void> => {
  console.log(`New member automation trigger detected with member id: ${memberId}!`)

  const userContext = await getUserContext(tenantId)

  try {
    // check if relevant automation exists in this tenant
    const automations = await AutomationRepository.find(
      {
        trigger: AutomationTrigger.NEW_MEMBER,
        state: AutomationState.ACTIVE,
      },
      userContext,
    )

    if (automations.length > 0) {
      console.log(`Found ${automations.length} automations to process!`)
      const member = await CommunityMemberRepository.findById(memberId, userContext, true, false)

      for (const automation of automations) {
        const settings = automation.settings as NewMemberSettings

        let process = true

        // check whether member platforms matches
        if (settings.platforms.length > 0) {
          const platforms = Object.keys(member.username)
          if (!platforms.some((platform) => settings.platforms.includes(platform))) {
            console.log(
              `Ignoring automation ${
                automation.id
              } - Member ${memberId} platforms do not include any of automation setting platforms: [${settings.platforms.join(
                ', ',
              )}]`,
            )
            process = false
          }
        }

        if (process) {
          console.log(`Member ${memberId} is being processed by automation ${automation.id}!`)

          switch (automation.type) {
            case AutomationType.WEBHOOK:
              await sendWebhookProcessRequest(tenantId, automation.id, member.id, member)
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
    console.log('Error while processing new member automation trigger!', error)
    throw error
  }
}
