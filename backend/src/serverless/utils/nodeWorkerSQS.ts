import { getServiceChildLogger } from '@crowd/logging'
import { SqsMessageAttributes, sendMessage } from '@crowd/sqs'
import { AutomationTrigger } from '@crowd/types'
import moment from 'moment'
import { IS_TEST_ENV, SQS_CONFIG } from '../../conf'
import { NodeWorkerMessageBase } from '../../types/mq/nodeWorkerMessageBase'
import { ExportableEntity } from '../microservices/nodejs/messageTypes'
import { NodeWorkerMessageType } from '../types/workerTypes'
import { SQS_CLIENT } from './serviceSQS'

const log = getServiceChildLogger('nodeWorkerSQS')

export const sendNodeWorkerMessage = async (
  tenantId: string,
  body: NodeWorkerMessageBase,
): Promise<void> => {
  if (IS_TEST_ENV) {
    return
  }

  // we can only delay for 15 minutes then we have to re-delay message
  let attributes: SqsMessageAttributes
  let delay: number

  const now = moment().valueOf()

  const params = {
    QueueUrl: SQS_CONFIG.nodejsWorkerQueue,
    MessageGroupId: `${now}`,
    MessageDeduplicationId: `${tenantId}-${now}`,
    MessageBody: JSON.stringify(body),
    MessageAttributes: attributes,
    DelaySeconds: delay,
  }

  log.debug(
    {
      messageType: body.type,
      body,
    },
    'Sending nodejs-worker sqs message!',
  )
  await sendMessage(SQS_CLIENT(), params)
}

export const sendNewActivityNodeSQSMessage = async (
  tenant: string,
  activityId: string,
  segmentId: string,
): Promise<void> => {
  const payload = {
    type: NodeWorkerMessageType.NODE_MICROSERVICE,
    tenant,
    activityId,
    segmentId,
    trigger: AutomationTrigger.NEW_ACTIVITY,
    service: 'automation',
  }
  await sendNodeWorkerMessage(tenant, payload as NodeWorkerMessageBase)
}

export const sendNewMemberNodeSQSMessage = async (
  tenant: string,
  memberId: string,
  segmentId: string,
): Promise<void> => {
  const payload = {
    type: NodeWorkerMessageType.NODE_MICROSERVICE,
    tenant,
    memberId,
    segmentId,
    trigger: AutomationTrigger.NEW_MEMBER,
    service: 'automation',
  }
  await sendNodeWorkerMessage(tenant, payload as NodeWorkerMessageBase)
}

export const sendExportCSVNodeSQSMessage = async (
  tenant: string,
  user: string,
  entity: ExportableEntity,
  segmentIds: string[],
  criteria: any,
): Promise<void> => {
  const payload = {
    type: NodeWorkerMessageType.NODE_MICROSERVICE,
    service: 'csv-export',
    user,
    tenant,
    entity,
    criteria,
    segmentIds,
  }
  await sendNodeWorkerMessage(tenant, payload as NodeWorkerMessageBase)
}

export const sendBulkEnrichMessage = async (
  tenant: string,
  memberIds: string[],
  segmentIds: string[],
  notifyFrontend: boolean = true,
  skipCredits: boolean = false,
): Promise<void> => {
  const payload = {
    type: NodeWorkerMessageType.NODE_MICROSERVICE,
    service: 'bulk-enrich',
    memberIds,
    tenant,
    segmentIds,
    notifyFrontend,
    skipCredits,
  }
  await sendNodeWorkerMessage(tenant, payload as NodeWorkerMessageBase)
}

export const sendOrgMergeMessage = async (
  tenantId: string,
  primaryOrgId: string,
  secondaryOrgId: string,
  notifyFrontend: boolean = true,
): Promise<void> => {
  const payload = {
    type: NodeWorkerMessageType.NODE_MICROSERVICE,
    service: 'org-merge',
    tenantId,
    primaryOrgId,
    secondaryOrgId,
    notifyFrontend,
  }
  await sendNodeWorkerMessage(tenantId, payload as NodeWorkerMessageBase)
}
