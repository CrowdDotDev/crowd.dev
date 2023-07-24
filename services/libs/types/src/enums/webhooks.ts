export enum WebhookState {
  PENDING = 'PENDING',
  PROCESSED = 'PROCESSED',
  ERROR = 'ERROR',
}

export enum WebhookType {
  GITHUB = 'GITHUB',
  DISCORD = 'DISCORD',
  DISCOURSE = 'DISCOURSE',
  FAKE = 'FAKE', // special type for streams
}

export enum DiscordWebsocketEvent {
  MEMBER_ADDED = 'member_added',
  MEMBER_UPDATED = 'member_updated',
  MESSAGE_CREATED = 'message_created',
  MESSAGE_UPDATED = 'message_updated',
}

export interface DiscordWebsocketPayload {
  event: DiscordWebsocketEvent
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any
}
