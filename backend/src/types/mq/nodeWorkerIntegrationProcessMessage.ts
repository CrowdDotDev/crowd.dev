import { NodeWorkerMessageType } from '../../serverless/types/worketTypes'
import { IntegrationType } from '../integrationEnums'
import { NodeWorkerMessageBase } from './nodeWorkerMessageBase'

export class NodeWorkerIntegrationProcessMessage extends NodeWorkerMessageBase {
  constructor(
    public readonly integrationType: IntegrationType,
    public readonly tenantId: string,
    public readonly onboarding: boolean,
    public readonly integrationId?: string,
    public readonly microserviceId?: string,
  ) {
    super(NodeWorkerMessageType.INTEGRATION_PROCESS)
  }
}
