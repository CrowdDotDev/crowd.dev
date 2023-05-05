import request from 'superagent'
import getUserContext from '../../../../../database/utils/getUserContext'
import AutomationRepository from '../../../../../database/repositories/automationRepository'
import { AutomationExecutionState } from '../../../../../types/automationTypes'
import AutomationExecutionService from '../../../../../services/automationExecutionService'
import { createServiceChildLogger } from '../../../../../utils/logging'
import SequelizeRepository from "../../../../../database/repositories/sequelizeRepository";
import SettingsRepository from "../../../../../database/repositories/settingsRepository";
import {newMemberBlocks} from "./slack/newMemberBlocks";
import {newActivityBlocks} from "./slack/newActivityBlocks";

const log = createServiceChildLogger('webhookWorker')

/**
 * Actually fire the webhook with the relevant payload
 *
 * @param tenantId tenant unique ID
 * @param automationId automation unique ID (or undefined)
 * @param automationData automation data (or undefined)
 * @param eventId trigger event unique ID
 * @param payload payload to send
 */
export default async (
  tenantId: string,
  automationId: string,
  automationData: any,
  eventId: string,
  payload: any,
): Promise<void> => {
  const options = await SequelizeRepository.getDefaultIRepositoryOptions()
  const tenantSettings = await SettingsRepository.getTenantSettings(tenantId, options)
  const userContext = await getUserContext(tenantId)

  const automationExecutionService = new AutomationExecutionService(userContext)

  const automation =
    automationData !== undefined
      ? automationData
      : await new AutomationRepository(userContext).findById(automationId)

  log.info(`Firing slack automation ${automation.id} for event ${eventId}!`)

  let slackMessage = null
  if(automation.trigger === 'new_member'){
    slackMessage = {
      text: `${payload.displayName} has joined your community!`,
      blocks: newMemberBlocks(payload)
    }
  }
  else if(automation.trigger === 'new_activity'){
    slackMessage = {
      text: ':satellite_antenna: New activity',
      blocks: newActivityBlocks(payload),
    }
  }
  else {
    log.warn(`Error no slack handler for automation trigger ${automation.trigger}!`)
    return
  }

  let success = false
  try {
    const result = await request
      .post(tenantSettings.dataValues.slackWebHook)
      .send(slackMessage)

    success = true
    log.debug(`Slack response code ${result.statusCode}!`)
  } catch (err) {
    log.warn(
      `Error while firing slack automation ${automation.id} for event ${eventId}!`,
    )

    let error: any

    if (err.status === 404) {
      error = {
        type: 'connect',
        message: `Could not access slack workspace!`,
      }
    }
    else {
      error = {
        type: 'connect',
      }
    }

    await automationExecutionService.create({
      automation,
      eventId,
      payload: slackMessage,
      state: AutomationExecutionState.ERROR,
      error,
    })

    throw err
  }

  if (success) {
    await automationExecutionService.create({
      automation,
      eventId,
      payload: slackMessage,
      state: AutomationExecutionState.SUCCESS,
    })
  }
}
