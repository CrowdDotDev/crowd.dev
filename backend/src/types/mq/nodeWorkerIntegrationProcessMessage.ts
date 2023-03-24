import { NodeWorkerMessageType } from '../../serverless/types/workerTypes'
import { IntegrationType } from '../integrationEnums'
import { NodeWorkerMessageBase } from './nodeWorkerMessageBase'
import { IIntegrationStream } from '../integration/stepResult'

export interface IIntegrationStreamRetry {
  id: string
  stream: IIntegrationStream
  retryCount: number
}

export class NodeWorkerIntegrationProcessMessage extends NodeWorkerMessageBase {
  constructor(
    public readonly integrationType: IntegrationType,
    public readonly tenantId: string,
    public readonly onboarding: boolean,
    public readonly integrationId?: string,
    public readonly microserviceId?: string,
    public readonly metadata?: any,
    public readonly retryStreams?: IIntegrationStreamRetry[],
    public readonly remainingStreams?: IIntegrationStream[],
    public readonly totalDuration?: number,
  ) {
    super(NodeWorkerMessageType.INTEGRATION_PROCESS)
  }
}
