export enum ApiMessageType {
  WEBSOCKET_MESSAGE = 'websocket_message',
}

export class ApiMessageBase {
  protected constructor(public readonly type: ApiMessageType) {}
}

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

export interface IApiPubSubEmitter {
  emitIntegrationCompleted(tenantId: string, integrationId: string, status: string): void
}
