import { AutomationType } from '@crowd/types'
import { getNodejsWorkerEmitter } from '@/serverless/utils/serviceSQS'

export const sendWebhookProcessRequest = async (
  tenant: string,
  automation: any,
  eventId: string,
  payload: any,
  type: AutomationType = AutomationType.WEBHOOK,
): Promise<void> => {
  const emitter = await getNodejsWorkerEmitter()
  await emitter.processAutomation(tenant, type, automation, eventId, payload)
}
