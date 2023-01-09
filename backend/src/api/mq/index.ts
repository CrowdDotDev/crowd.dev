import { deleteMessage, receiveMessage } from '../../utils/sqs'
import { SQS_CONFIG } from '../../config'
import WebSocketNamespace from '../websockets/namespace'
import { IAuthenticatedSocket } from '../websockets/types'
import { createChildLogger, createServiceChildLogger } from '../../utils/logging'
import { ApiMessageBase, ApiMessageType } from '../../types/mq/apiMessageBase'
import { ApiWebsocketMessage } from '../../types/mq/apiWebsocketMessage'

/* eslint-disable no-case-declarations */

const log = createServiceChildLogger('apiMq')

export const handleApiQueueMessages = async (
  websockets: WebSocketNamespace<IAuthenticatedSocket>,
): Promise<void> => {
  log.info('Listening for messages on the API queue!')

  // noinspection InfiniteLoopJS
  while (true) {
    const message = await receiveMessage({
      QueueUrl: SQS_CONFIG.apiQueue,
    })

    if (message) {
      log.debug('Received message from API queue!', {
        message,
      })

      const msg: ApiMessageBase = JSON.parse(message.Body)

      await deleteMessage({
        QueueUrl: SQS_CONFIG.apiQueue,
        ReceiptHandle: message.ReceiptHandle,
      })

      const messageLogger = createChildLogger('apiMqMessageHandler', log, {
        messageId: message.MessageId,
        type: msg.type,
      })

      try {
        switch (msg.type) {
          case ApiMessageType.WEBSOCKET_MESSAGE:
            const payload = msg as ApiWebsocketMessage
            if (payload.userId) {
              await websockets.emitToUserRoom(payload.userId, payload.event, payload.data)
            } else if (payload.tenantId) {
              await websockets.emitToTenantRoom(payload.tenantId, payload.event, payload.data)
            } else {
              throw new Error('No userId or tenantId specified - cannot send websocket message!')
            }
            break
          default:
        }
      } catch (err) {
        messageLogger.error(err, 'Error while handling api mq message!')
      }
    }
  }
}
