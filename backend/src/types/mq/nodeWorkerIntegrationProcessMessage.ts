import { NodeWorkerMessageType } from '../../serverless/types/workerTypes'
import { NodeWorkerMessageBase } from './nodeWorkerMessageBase'
import { IIntegrationStream } from '../integration/stepResult'

export interface IIntegrationStreamRetry {
  id: string
  stream: IIntegrationStream
  retryCount: number
}

export class NodeWorkerIntegrationProcessMessage extends NodeWorkerMessageBase {
  constructor(
    public readonly runId: string,
    public readonly streamId?: string,
    public readonly fireCrowdWebhooks?: boolean,
  ) {
    super(NodeWorkerMessageType.INTEGRATION_PROCESS)
  }
}
