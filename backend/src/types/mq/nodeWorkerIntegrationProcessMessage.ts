import { NodeWorkerMessageType } from '../../serverless/types/workerTypes'
import { NodeWorkerMessageBase } from './nodeWorkerMessageBase'
import { IIntegrationStream } from '../integration/stepResult'

export interface IIntegrationStreamRetry {
  id: string
  stream: IIntegrationStream
  retryCount: number
}

export class NodeWorkerIntegrationProcessMessage extends NodeWorkerMessageBase {
  constructor(public readonly runId: string, public readonly metadata?: any) {
    super(NodeWorkerMessageType.INTEGRATION_PROCESS)
  }
}
