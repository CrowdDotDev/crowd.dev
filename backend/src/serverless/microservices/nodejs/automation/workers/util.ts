import sendNodeMicroserviceMessage from '../../nodeMicroserviceSQS'
import { AutomationType } from '../../../../../types/automationTypes'

export const sendWebhookProcessRequest = async (
  tenant: string,
  automationId: string,
  eventId: string,
  payload: any,
): Promise<void> => {
  await sendNodeMicroserviceMessage({
    service: 'automation-process',
    automationType: AutomationType.WEBHOOK,
    tenant,
    automationId,
    eventId,
    payload,
  })
}
