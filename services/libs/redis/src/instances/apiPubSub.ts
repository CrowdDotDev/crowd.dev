import { Logger, LoggerBase } from '@crowd/logging'
import { ApiWebsocketMessage, IApiPubSubEmitter } from '@crowd/types'
import { RedisPubSubEmitter } from '../pubsub'
import { RedisClient } from '../types'

export class ApiPubSubEmitter extends LoggerBase implements IApiPubSubEmitter {
  private readonly pubsub: RedisPubSubEmitter

  constructor(redis: RedisClient, parentLog: Logger) {
    super(parentLog, {
      pubSubScope: 'api-pubsub',
    })

    this.pubsub = new RedisPubSubEmitter(
      'api-pubsub',
      redis,
      (err) => {
        this.log.error(err, 'Error in api-pubsub emitter!')
      },
      this.log,
    )
  }

  public emitIntegrationCompleted(tenantId: string, integrationId: string, status: string) {
    this.pubsub.emit(
      'user',
      new ApiWebsocketMessage(
        'integration-completed',
        JSON.stringify({
          integrationId,
          status,
        }),
        undefined,
        tenantId,
      ),
    )
  }

  emit<T>(channel: string, data: T) {
    this.pubsub.emit(channel, data)
  }
}
