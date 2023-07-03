import { getServiceChildLogger } from '@crowd/logging'
import AutomationExecutionRepository from '../../../../../database/repositories/automationExecutionRepository'
import AutomationRepository from '../../../../../database/repositories/automationRepository'
import MemberRepository from '../../../../../database/repositories/memberRepository'
import SequelizeRepository from '../../../../../database/repositories/sequelizeRepository'
import getUserContext from '../../../../../database/utils/getUserContext'
import {
  AutomationData,
  AutomationState,
  AutomationTrigger,
  AutomationType,
  NewMemberSettings,
} from '../../../../../types/automationTypes'
import { sendWebhookProcessRequest } from './util'

const log = getServiceChildLogger('newMemberWorker')

/**
 * Helper function to check whether a single member should be processed by automation
 * @param member Member data
 * @param automation {AutomationData} Automation data
 */
export const shouldProcessMember = async (
  member: any,
  automation: AutomationData,
): Promise<boolean> => {
  const settings = automation.settings as NewMemberSettings

  let process = true

  // check whether member platforms matches
  if (settings.platforms && settings.platforms.length > 0) {
    const platforms = Object.keys(member.username)
    if (!platforms.some((platform) => settings.platforms.includes(platform))) {
      log.warn(
        `Ignoring automation ${automation.id} - Member ${
          member.id
        } platforms do not include any of automation setting platforms: [${settings.platforms.join(
          ', ',
        )}]`,
      )
      process = false
    }
  }

  if (process) {
    const userContext = await SequelizeRepository.getDefaultIRepositoryOptions()
    const repo = new AutomationExecutionRepository(userContext)

    const hasAlreadyBeenTriggered = await repo.hasAlreadyBeenTriggered(automation.id, member.id)
    if (hasAlreadyBeenTriggered) {
      log.warn(`Ignoring automation ${automation.id} - Member ${member.id} was already processed!`)
      process = false
    }
  }

  return process
}

/**
 * Return a cleaned up copy of the member that contains only data that is relevant for automation.
 *
 * @param member Member data as it came from the repository layer
 * @returns a cleaned up payload to use with automation
 */
export const prepareMemberPayload = (member: any): any => {
  const copy = { ...member }

  delete copy.importHash
  delete copy.signals
  delete copy.type
  delete copy.score
  delete copy.updatedAt
  delete copy.updatedById
  delete copy.deletedAt

  return copy
}
/**
 * Check whether this member matches any automations for tenant.
 * If so emit automation process messages to NodeJS microservices SQS queue.
 *
 * @param tenantId tenant unique ID
 * @param memberId tenant member ID
 * @param memberData community member data
 */
export default async (tenantId: string, memberId: string, segmentId: string): Promise<void> => {
  const userContext = await getUserContext(tenantId, null, [segmentId])

  try {
    // check if relevant automation exists in this tenant
    const automations = await new AutomationRepository(userContext).findAll({
      trigger: AutomationTrigger.NEW_MEMBER,
      state: AutomationState.ACTIVE,
    })

    if (automations.length > 0) {
      log.info(`Found ${automations.length} automations to process!`)

      const member = await MemberRepository.findById(memberId, userContext)

      for (const automation of automations) {
        if (await shouldProcessMember(member, automation)) {
          log.info(`Member ${member.id} is being processed by automation ${automation.id}!`)

          switch (automation.type) {
            case AutomationType.WEBHOOK:
              await sendWebhookProcessRequest(
                tenantId,
                automation,
                member.id,
                prepareMemberPayload(member),
                AutomationType.WEBHOOK,
              )
              break
            case AutomationType.SLACK:
              await sendWebhookProcessRequest(
                tenantId,
                automation,
                member.id,
                prepareMemberPayload(member),
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
    log.error(error, 'Error while processing new member automation trigger!')
    throw error
  }
}
