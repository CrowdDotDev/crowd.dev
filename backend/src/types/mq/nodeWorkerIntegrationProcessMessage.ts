import { NodeWorkerMessageType } from '../../serverless/types/workerTypes'
import { IntegrationType } from '../integrationEnums'
import { NodeWorkerMessageBase } from './nodeWorkerMessageBase'

export class NodeWorkerIntegrationProcessMessage extends NodeWorkerMessageBase {
  constructor(
    public readonly integrationType: IntegrationType,
    public readonly tenantId: string,
    public readonly onboarding: boolean,
    public readonly integrationId?: string,
    public readonly microserviceId?: string,
    public readonly metadata?: any,
  ) {
    super(NodeWorkerMessageType.INTEGRATION_PROCESS)
  }
}
