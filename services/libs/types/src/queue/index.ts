export interface IQueueMessage {
  type: string
}

export interface ISqsQueueReceiver {
  start(): Promise<void>

  stop(): void

  processMessage(data: IQueueMessage): Promise<void>
}

export interface ISqsQueueEmitter {
  init(): Promise<void>

  sendMessage<T extends IQueueMessage>(
    groupId: string,
    message: T,
    deduplicationId?: string,
  ): Promise<void>

  sendMessages<T extends IQueueMessage>(
    messages: { payload: T; groupId: string; deduplicationId?: string; id?: string }[],
  ): Promise<void>
}
