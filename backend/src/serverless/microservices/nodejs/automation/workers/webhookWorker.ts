import request from 'superagent'
import getUserContext from '../../../../../database/utils/getUserContext'
import AutomationRepository from '../../../../../database/repositories/automationRepository'
import { AutomationExecutionState, WebhookSettings } from '../../../../../types/automationTypes'
import AutomationExecutionHistoryRepository from '../../../../../database/repositories/automationExecutionHistoryRepository'

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

  const automation = await AutomationRepository.findById(automationId, userContext)
  const settings = automation.settings as WebhookSettings

  const now = new Date()
  console.log(`Firing automation ${automationId} for event ${eventId} to url '${settings.url}'!`)
  try {
    const result = await request
      .post(settings.url)
      .send({
        eventId,
        eventType: automation.trigger,
        eventExecutedAt: now.toISOString(),
        eventPayload: payload,
      })
      .set('User-Agent', 'Crowd.dev Automations Executor')
      .set('X-CrowdDotDev-Event-Type', automation.trigger)
      .set('X-CrowdDotDev-Event-ID', eventId)

    console.log(`Webhook response code ${result.statusCode}!`)

    await AutomationExecutionHistoryRepository.create(
      {
        tenantId,
        automationId,
        eventId,
        trigger: automation.trigger,
        type: automation.type,
        state: AutomationExecutionState.SUCCESS,
        error: null,
        payload,
        executedAt: now,
      },
      userContext,
    )
  } catch (error) {
    console.log(
      `Error while firing webhook automation ${automationId} for event ${eventId} to url '${settings.url}'!`,
      error,
    )

    await AutomationExecutionHistoryRepository.create(
      {
        tenantId,
        automationId,
        eventId,
        trigger: automation.trigger,
        type: automation.type,
        state: AutomationExecutionState.ERROR,
        error,
        payload,
        executedAt: now,
      },
      userContext,
    )

    throw error
  }
}
