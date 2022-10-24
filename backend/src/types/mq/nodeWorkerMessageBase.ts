import { NodeWorkerMessageType } from '../../serverless/types/workerTypes'

export class NodeWorkerMessageBase {
  protected constructor(public readonly type: NodeWorkerMessageType) {}
}
