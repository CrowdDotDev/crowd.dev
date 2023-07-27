import { NodeWorkerMessageType } from '../workerTypes'
import { NodeWorkerMessageBase } from './nodeWorkerMessageBase'

export class NodeWorkerProcessWebhookMessage extends NodeWorkerMessageBase {
  constructor(
    public readonly tenantId: string,
    public readonly webhookId: string,
    public readonly force?: boolean,
    public readonly fireCrowdWebhooks?: boolean,
  ) {
    super(NodeWorkerMessageType.PROCESS_WEBHOOK)
  }
}
