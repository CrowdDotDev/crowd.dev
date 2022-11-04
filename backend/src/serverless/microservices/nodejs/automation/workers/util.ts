import { NodeWorkerMessageType } from '../../../../types/workerTypes'
import { sendNodeWorkerMessage } from '../../../../utils/nodeWorkerSQS'
import { AutomationType } from '../../../../../types/automationTypes'
import { NodeWorkerMessageBase } from '../../../../../types/mq/nodeWorkerMessageBase'

export const sendWebhookProcessRequest = async (
  tenant: string,
  automation: any,
  eventId: string,
  payload: any,
): Promise<void> => {
  const event = {
    type: NodeWorkerMessageType.NODE_MICROSERVICE,
    service: 'automation-process',
    automationType: AutomationType.WEBHOOK,
    tenant,
    automation,
    eventId,
    payload,
  }
  await sendNodeWorkerMessage(tenant, event as NodeWorkerMessageBase)
}
