import { AutomationType } from '@crowd/types'
import { NodeWorkerMessageType } from '../../../../types/workerTypes'
import { sendNodeWorkerMessage } from '../../../../utils/nodeWorkerSQS'
import { NodeWorkerMessageBase } from '../../../../../types/mq/nodeWorkerMessageBase'

export const sendWebhookProcessRequest = async (
  tenant: string,
  automation: any,
  eventId: string,
  payload: any,
  type: AutomationType = AutomationType.WEBHOOK,
): Promise<void> => {
  const event = {
    type: NodeWorkerMessageType.NODE_MICROSERVICE,
    service: 'automation-process',
    automationType: type,
    tenant,
    automation,
    eventId,
    payload,
  }
  await sendNodeWorkerMessage(tenant, event as NodeWorkerMessageBase)
}
