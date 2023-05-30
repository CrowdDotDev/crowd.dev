import { IntegrationType } from '@crowd/types'
import { NodeWorkerMessageType } from '../../serverless/types/workerTypes'
import { NodeWorkerMessageBase } from './nodeWorkerMessageBase'

export class NodeWorkerIntegrationCheckMessage extends NodeWorkerMessageBase {
  constructor(public readonly integrationType: IntegrationType) {
    super(NodeWorkerMessageType.INTEGRATION_CHECK)
  }
}
