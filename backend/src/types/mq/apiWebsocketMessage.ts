import { ApiMessageBase, ApiMessageType } from './apiMessageBase'

export class ApiWebsocketMessage extends ApiMessageBase {
  constructor(
    public readonly event: string,
    public readonly data: string,
    public readonly userId?: string,
    public readonly tenantId?: string,
  ) {
    super(ApiMessageType.WEBSOCKET_MESSAGE)
  }
}
