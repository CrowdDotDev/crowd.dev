import request from 'superagent'
import getUserContext from '../../../../../database/utils/getUserContext'
import AutomationRepository from '../../../../../database/repositories/automationRepository'
import { AutomationExecutionState, WebhookSettings } from '../../../../../types/automationTypes'
import AutomationExecutionService from '../../../../../services/automationExecutionService'

/**
 * Actually fire the webhook with the relevant payload
 *
 * @param tenantId tenant unique ID
 * @param automationId automation unique ID
 * @param eventId trigger event unique ID
 * @param payload payload to send
 */
export default async (
  tenantId: string,
  automationId: string,
  eventId: string,
  payload: any,
): Promise<void> => {
  const userContext = await getUserContext(tenantId)
  const automationExecutionService = new AutomationExecutionService(userContext)

  const automation = await new AutomationRepository(userContext).findById(automationId)
  const settings = automation.settings as WebhookSettings

  const now = new Date()
  console.log(`Firing automation ${automationId} for event ${eventId} to url '${settings.url}'!`)
  const eventPayload = {
    eventId,
    eventType: automation.trigger,
    eventExecutedAt: now.toISOString(),
    eventPayload: payload,
  }

  let success = false
  try {
    const result = await request
      .post(settings.url)
      .send(eventPayload)
      .set('User-Agent', 'Crowd.dev Automations Executor')
      .set('X-CrowdDotDev-Event-Type', automation.trigger)
      .set('X-CrowdDotDev-Event-ID', eventId)

    success = true
    console.log(`Webhook response code ${result.statusCode}!`)
  } catch (err) {
    console.log(
      `Error while firing webhook automation ${automationId} for event ${eventId} to url '${settings.url}'!`,
      err,
    )

    let error: any

    if (err.syscall && err.code) {
      error = {
        type: 'network',
        message: `Could not access ${settings.url}!`
      }
    } else if (err.status) {
      error = {
        type: 'http_status',
        message: `POST @ ${settings.url} returned ${err.statusCode} - ${err.statusMessage}!`,
        body: err.res.body
      }
    } else {
      error = {
        type: 'unknown',
        message: err.message,
        errorObject: err
      }
    }

    await automationExecutionService.create({
      automation,
      eventId,
      payload: eventPayload,
      state: AutomationExecutionState.ERROR,
      error,
    })


    throw err
  }

  if (success) {
    await automationExecutionService.create({
      automation,
      eventId,
      payload: eventPayload,
      state: AutomationExecutionState.SUCCESS,
    })
  }
}
