import { NodeWorkerMessageType } from '../../../../types/worketTypes'
import { sendNodeWorkerMessage } from '../../../../utils/nodeWorkerSQS'
import { KUBE_MODE } from '../../../../../config'
import sendNodeMicroserviceMessage from '../../nodeMicroserviceSQS'
import { AutomationType } from '../../../../../types/automationTypes'
import { NodeWorkerMessageBase } from '../../../../../types/mq/nodeWorkerMessageBase'

export const sendWebhookProcessRequest = async (
  tenant: string,
  automationId: string,
  eventId: string,
  payload: any,
): Promise<void> => {
  // TODO-kube
  if (KUBE_MODE) {
    const event = {
      type: NodeWorkerMessageType.NODE_MICROSERVICE,
      service: 'automation-process',
      automationType: AutomationType.WEBHOOK,
      tenant,
      automationId,
      eventId,
      payload,
    }
    await sendNodeWorkerMessage(tenant, event as NodeWorkerMessageBase)
  } else {
    await sendNodeMicroserviceMessage({
      service: 'automation-process',
      automationType: AutomationType.WEBHOOK,
      tenant,
      automationId,
      eventId,
      payload,
    })
  }
}
