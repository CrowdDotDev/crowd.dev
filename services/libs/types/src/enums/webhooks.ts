export enum WebhookState {
  PENDING = 'PENDING',
  PROCESSED = 'PROCESSED',
  ERROR = 'ERROR',
}

export enum WebhookType {
  GITHUB = 'GITHUB',
  GITLAB = 'GITLAB',
  DISCORD = 'DISCORD',
  DISCOURSE = 'DISCOURSE',
  GROUPSIO = 'GROUPSIO',
  CROWD_GENERATED = 'CROWD_GENERATED',
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
