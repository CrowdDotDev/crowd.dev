import { NodeWorkerMessageType } from '../workerTypes'

export class NodeWorkerMessageBase {
  protected constructor(public readonly type: NodeWorkerMessageType) {}
}
