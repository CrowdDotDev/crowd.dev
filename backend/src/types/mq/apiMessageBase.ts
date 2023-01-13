export enum ApiMessageType {
  WEBSOCKET_MESSAGE = 'websocket_message',
}

export class ApiMessageBase {
  protected constructor(public readonly type: ApiMessageType) {}
}
