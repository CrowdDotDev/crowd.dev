import { NodeWorkerMessageType } from '../../serverless/types/workerTypes'
import { IntegrationType } from '../integrationEnums'
import { NodeWorkerMessageBase } from './nodeWorkerMessageBase'

export class NodeWorkerIntegrationCheckMessage extends NodeWorkerMessageBase {
  constructor(public readonly integrationType: IntegrationType) {
    super(NodeWorkerMessageType.INTEGRATION_CHECK)
  }
}
