import { NodeWorkerMessageType } from '../../serverless/types/worketTypes'

export class NodeWorkerMessageBase {
  protected constructor(public readonly type: NodeWorkerMessageType) {}
}
