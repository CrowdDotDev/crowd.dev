import { addSeconds, singleOrDefault } from '@crowd/common'
import { DbStore } from '@crowd/database'
import {
  INTEGRATION_SERVICES,
  IProcessStreamContext,
  IProcessWebhookStreamContext,
} from '@crowd/integrations'
import { Logger, LoggerBase, getChildLogger } from '@crowd/logging'
import { RedisCache, RedisClient, RateLimiter } from '@crowd/redis'
import {
  IntegrationDataWorkerEmitter,
  IntegrationRunWorkerEmitter,
  IntegrationStreamWorkerEmitter,
} from '@crowd/sqs'
import {
  IntegrationRunState,
  IntegrationState,
  IntegrationStreamType,
  RateLimitError,
  WebhookType,
} from '@crowd/types'
import { NANGO_CONFIG, PLATFORM_CONFIG, WORKER_SETTINGS } from '../conf'
import IntegrationStreamRepository from '../repo/integrationStream.repo'
import { IStreamData } from '@/repo/integrationStream.data'
import IncomingWebhookRepository from '@/repo/incomingWebhook.repo'

export default class IntegrationStreamService extends LoggerBase {
  private readonly repo: IntegrationStreamRepository
  private readonly webhookRepo: IncomingWebhookRepository

  constructor(
    private readonly redisClient: RedisClient,
    private readonly runWorkerEmitter: IntegrationRunWorkerEmitter,
    private readonly dataWorkerEmitter: IntegrationDataWorkerEmitter,
    private readonly streamWorkerEmitter: IntegrationStreamWorkerEmitter,
    store: DbStore,
    parentLog: Logger,
  ) {
    super(parentLog)

    this.repo = new IntegrationStreamRepository(store, this.log)
    this.webhookRepo = new IncomingWebhookRepository(store, this.log)
  }

  public async checkStreams(): Promise<void> {
    this.log.info('Checking for delayed streams!')

    let streams = await this.repo.getPendingDelayedStreams(1, 10)
    while (streams.length > 0) {
      this.log.info({ streamCount: streams.length }, 'Found delayed streams!')

      for (const stream of streams) {
        this.log.info({ streamId: stream.id }, 'Restarting delayed stream!')
        await this.repo.resetStream(stream.id)
        if (stream.runId) {
          await this.streamWorkerEmitter.triggerStreamProcessing(
            stream.tenantId,
            stream.integrationType,
            stream.id,
          )
        } else {
          await this.streamWorkerEmitter.triggerWebhookProcessing(
            stream.tenantId,
            stream.integrationType,
            stream.webhookId,
          )
        }
      }

      streams = await this.repo.getPendingDelayedStreams(1, 10)
    }
  }

  public async continueProcessingRunStreams(runId: string): Promise<void> {
    this.log.info('Continuing processing run streams!')

    let streams = await this.repo.getPendingStreams(runId, 20)
    while (streams.length > 0) {
      for (const stream of streams) {
        this.log.info({ streamId: stream.id }, 'Triggering stream processing!')
        this.streamWorkerEmitter.triggerStreamProcessing(
          stream.tenantId,
          stream.integrationType,
          stream.id,
        )
      }

      streams = await this.repo.getPendingStreams(runId, 20, streams[streams.length - 1].id)
    }
  }

  private async triggerRunError(
    runId: string,
    location: string,
    message: string,
    metadata?: unknown,
    error?: Error,
  ): Promise<void> {
    await this.repo.markRunError(runId, {
      location,
      message,
      metadata,
      errorMessage: error?.message,
      errorStack: error?.stack,
      errorString: error ? JSON.stringify(error) : undefined,
    })
  }

  private async triggerStreamError(
    stream: IStreamData,
    location: string,
    message: string,
    metadata?: unknown,
    err?: Error,
  ): Promise<void> {
    if (err instanceof RateLimitError) {
      const until = addSeconds(new Date(), err.rateLimitResetSeconds)
      this.log.error(
        { until: until.toISOString() },
        'Rate limit error detected - pausing entire run!',
      )
      if (stream.runId) {
        await this.repo.resetStream(stream.id)
        await this.repo.delayRun(stream.runId, until)
      } else {
        await this.repo.delayStream(stream.id, until)
      }

      return
    }

    await this.repo.markStreamError(stream.id, {
      location,
      message,
      metadata,
      errorMessage: err?.message,
      errorStack: err?.stack,
      errorString: err ? JSON.stringify(err) : undefined,
    })

    if (stream.retries + 1 <= WORKER_SETTINGS().maxStreamRetries) {
      // delay for #retries * 15 minutes
      const until = addSeconds(new Date(), (stream.retries + 1) * 15 * 60)
      this.log.warn({ until: until.toISOString() }, 'Retrying stream!')
      await this.repo.delayStream(stream.id, until)
      return
    }

    if (stream.webhookId) {
      await this.webhookRepo.markWebhookError(stream.webhookId, {
        errorMessage: err?.message,
        errorStack: err?.stack,
        errorString: err ? JSON.stringify(err) : undefined,
      })
    }

    // stop run because of stream error
    if (stream.runId) {
      this.log.warn('Reached maximum retries for stream! Stopping the run!')
      await this.triggerRunError(
        stream.runId,
        'stream-run-stop',
        'Stream reached maximum retries!',
        {
          retries: stream.retries + 1,
          maxRetries: WORKER_SETTINGS().maxStreamRetries,
        },
      )
    }
  }

  public async processWebhookStream(webhookId: string): Promise<boolean> {
    this.log.debug({ webhookId }, 'Trying to process webhook!')

    // get webhook info
    const webhookInfo = await this.webhookRepo.getWebhookById(webhookId)

    if (!webhookInfo) {
      this.log.error({ webhookId }, 'Webhook not found!')
      return
    }

    let streamId: string | undefined

    // let's see if we already have a stream for this webhook
    streamId = await this.repo.getStreamIdByWebhookId(webhookId)

    if (!streamId) {
      // no stream found, let's create one
      this.log.debug({ webhookId }, 'No existing stream found for the webhook, creating it!')

      // creating stream to process webhook
      // webhookId is used as stream identifier
      streamId = await this.repo.publishWebhookStream(
        webhookId,
        webhookId,
        webhookInfo.payload,
        webhookInfo.integrationId,
        webhookInfo.tenantId,
      )

      if (!streamId) {
        this.log.error({ webhookId }, 'Could not create webhook stream!')
        return
      }

      this.log.debug({ webhookId, streamId }, 'Webhook stream created!')
    } else {
      this.log.debug({ webhookId, streamId }, 'Found existing webhook stream, using it!')
    }

    // getting all stream info
    const streamInfo = await this.repo.getStreamData(streamId)

    if (!streamInfo) {
      this.log.error({ webhookStreamId: streamId }, 'Webhook stream not found!')
      return
    }

    if (streamInfo.runId) {
      this.log.warn({ streamId }, 'Stream is a regular stream! Processing as such!')
      await this.processStream(streamId)
      return
    }

    if (streamInfo.integrationState === IntegrationState.NEEDS_RECONNECT) {
      this.log.warn('Integration is not correctly connected! Deleting the stream and webhook!')
      await this.repo.deleteStream(streamId)
      await this.webhookRepo.deleteWebhook(webhookId)
      return
    }

    this.log = getChildLogger('webhook-stream-processor', this.log, {
      webhookId: streamInfo.webhookId,
      integrationId: streamInfo.integrationId,
      platform: streamInfo.integrationType,
    })

    const integrationService = singleOrDefault(
      INTEGRATION_SERVICES,
      (i) => i.type === streamInfo.integrationType,
    )

    if (!integrationService) {
      this.log.error({ type: streamInfo.integrationType }, 'Could not find integration service!')
      await this.triggerStreamError(
        streamInfo,
        'check-webhook-stream-int-service',
        'Could not find integration service!',
        {
          type: streamInfo.integrationType,
        },
      )
      return
    }

    if (!integrationService.processWebhookStream) {
      this.log.error(
        { type: streamInfo.integrationType },
        'Integration service does not have processWebhookStream processing defined!',
      )
      await this.triggerStreamError(
        streamInfo,
        'check-webhook-stream-int-service',
        'Integration service does not have processWebhookStream processing defined!',
        {
          type: streamInfo.integrationType,
        },
      )
      return
    }

    const cache = new RedisCache(
      `int-${streamInfo.tenantId}-${streamInfo.integrationType}`,
      this.redisClient,
      this.log,
    )

    const globalCache = new RedisCache(`int-global`, this.redisClient, this.log)

    const integrationCache = new RedisCache(
      `int-${streamInfo.integrationId}`,
      this.redisClient,
      this.log,
    )

    const nangoConfig = NANGO_CONFIG()

    const context: IProcessWebhookStreamContext = {
      serviceSettings: {
        nangoUrl: nangoConfig.url,
        nangoSecretKey: nangoConfig.secretKey,
        nangoId: `${streamInfo.tenantId}-${streamInfo.integrationType}`,
      },

      platformSettings: PLATFORM_CONFIG(streamInfo.integrationType),

      integration: {
        id: streamInfo.integrationId,
        identifier: streamInfo.integrationIdentifier,
        platform: streamInfo.integrationType,
        status: streamInfo.integrationState,
        settings: streamInfo.integrationSettings,
        token: streamInfo.integrationToken,
      },

      stream: {
        identifier: streamInfo.identifier,
        type: streamInfo.parentId ? IntegrationStreamType.CHILD : IntegrationStreamType.ROOT,
        data: streamInfo.data,
        webhookCreatedAt: webhookInfo.createdAt,
      },

      log: this.log,
      cache,
      globalCache,
      integrationCache,

      publishData: async (data) => {
        await this.publishData(
          streamInfo.tenantId,
          streamInfo.integrationType,
          streamId,
          data,
          undefined,
        )
      },
      publishStream: async (identifier, data) => {
        const webhookId = await this.webhookRepo.createWebhook(
          streamInfo.tenantId,
          streamInfo.integrationId,
          // not a real webhok, just for compatibility
          WebhookType.CROWD_GENERATED,
          data,
        )
        await this.publishStream(
          streamInfo.tenantId,
          streamInfo.integrationType,
          streamId,
          identifier,
          data,
          undefined,
          webhookId,
          streamInfo.integrationId,
        )
      },
      updateIntegrationSettings: async (settings) => {
        await this.updateIntegrationSettings(streamId, settings, streamInfo.runId)
      },

      abortWithError: async (message: string, metadata?: unknown, error?: Error) => {
        this.log.error({ message }, 'Aborting webhook stream processing with error!')
        await this.triggerStreamError(streamInfo, 'webhook-stream-abort', message, metadata, error)
      },
      getRateLimiter: (maxRequests: number, timeWindowSeconds: number, counterKey: string) => {
        return new RateLimiter(globalCache, maxRequests, timeWindowSeconds, counterKey)
      },
    }

    this.log.debug('Processing webhook stream!')
    try {
      await integrationService.processWebhookStream(context)
      this.log.debug('Finished processing webhook stream!')
      await this.repo.deleteStream(streamId)
      await this.webhookRepo.markWebhookProcessed(webhookId)
      return true
    } catch (err) {
      this.log.error(err, 'Error while processing webhook stream!')
      try {
        await this.triggerStreamError(
          streamInfo,
          'webhook-stream-process',
          'Error while processing webhook stream!',
          undefined,
          err,
        )
      } catch (err2) {
        this.log.error(err2, 'Error while triggering stream error!')
      }

      return false
    }
  }

  public async processStream(streamId: string): Promise<boolean> {
    this.log.debug({ streamId }, 'Trying to process stream!')

    const streamInfo = await this.repo.getStreamData(streamId)

    if (!streamInfo) {
      this.log.error({ streamId }, 'Stream not found!')
      return
    }

    if (streamInfo.webhookId) {
      this.log.warn({ streamId }, 'Stream is a webhook stream! Processing as such!')
      await this.processWebhookStream(streamInfo.webhookId)
      return
    }

    if (streamInfo.runState === IntegrationRunState.DELAYED) {
      this.log.warn('Run is delayed! Skipping stream processing!')
      return
    }

    if (streamInfo.runState === IntegrationRunState.INTEGRATION_DELETED) {
      this.log.warn('Integration was deleted! Skipping stream processing! Deleting the stream!')
      await this.repo.deleteStream(streamId)
      return
    }

    if (streamInfo.integrationState === IntegrationState.NEEDS_RECONNECT) {
      this.log.warn('Integration is not correctly connected! Deleting the stream!')
      await this.repo.deleteStream(streamId)
      return
    }

    this.log = getChildLogger('stream-processor', this.log, {
      streamId,
      runId: streamInfo.runId,
      integrationId: streamInfo.integrationId,
      onboarding: streamInfo.onboarding,
      platform: streamInfo.integrationType,
    })

    const integrationService = singleOrDefault(
      INTEGRATION_SERVICES,
      (i) => i.type === streamInfo.integrationType,
    )

    if (!integrationService) {
      this.log.error({ type: streamInfo.integrationType }, 'Could not find integration service!')
      await this.triggerStreamError(
        streamInfo,
        'check-stream-int-service',
        'Could not find integration service!',
        {
          type: streamInfo.integrationType,
        },
      )
      return
    }

    const cache = new RedisCache(
      `int-${streamInfo.tenantId}-${streamInfo.integrationType}`,
      this.redisClient,
      this.log,
    )

    const globalCache = new RedisCache(`int-global`, this.redisClient, this.log)

    const integrationCache = new RedisCache(
      `int-${streamInfo.integrationId}`,
      this.redisClient,
      this.log,
    )

    const nangoConfig = NANGO_CONFIG()

    const context: IProcessStreamContext = {
      onboarding: streamInfo.onboarding,
      serviceSettings: {
        nangoUrl: nangoConfig.url,
        nangoSecretKey: nangoConfig.secretKey,
        nangoId: `${streamInfo.tenantId}-${streamInfo.integrationType}`,
      },

      platformSettings: PLATFORM_CONFIG(streamInfo.integrationType),

      integration: {
        id: streamInfo.integrationId,
        identifier: streamInfo.integrationIdentifier,
        platform: streamInfo.integrationType,
        status: streamInfo.integrationState,
        settings: streamInfo.integrationSettings,
        token: streamInfo.integrationToken,
      },

      stream: {
        identifier: streamInfo.identifier,
        type: streamInfo.parentId ? IntegrationStreamType.CHILD : IntegrationStreamType.ROOT,
        data: streamInfo.data,
      },

      log: this.log,
      cache,
      globalCache,
      integrationCache,

      publishData: async (data) => {
        await this.publishData(
          streamInfo.tenantId,
          streamInfo.integrationType,
          streamId,
          data,
          streamInfo.runId,
        )
      },
      publishStream: async (identifier, data) => {
        await this.publishStream(
          streamInfo.tenantId,
          streamInfo.integrationType,
          streamId,
          identifier,
          data,
          streamInfo.runId,
          undefined,
          undefined,
        )
      },
      updateIntegrationSettings: async (settings) => {
        await this.updateIntegrationSettings(streamId, settings)
      },

      abortWithError: async (message: string, metadata?: unknown, error?: Error) => {
        this.log.error({ message }, 'Aborting stream processing with error!')
        await this.triggerStreamError(streamInfo, 'stream-abort', message, metadata, error)
      },
      abortRunWithError: async (message: string, metadata?: unknown, error?: Error) => {
        this.log.error({ message }, 'Aborting run with error!')
        await this.triggerRunError(streamInfo.runId, 'stream-run-abort', message, metadata, error)
      },
      getRateLimiter: (maxRequests: number, timeWindowSeconds: number, counterKey: string) => {
        return new RateLimiter(globalCache, maxRequests, timeWindowSeconds, counterKey)
      },
    }

    this.log.debug('Processing stream!')
    try {
      await integrationService.processStream(context)
      this.log.debug('Finished processing stream!')
      await this.repo.deleteStream(streamId)
      return true
    } catch (err) {
      this.log.error(err, 'Error while processing stream!')
      try {
        await this.triggerStreamError(
          streamInfo,
          'stream-process',
          'Error while processing stream!',
          undefined,
          err,
        )
      } catch (err2) {
        this.log.error(err2, 'Error while triggering stream error!')
      }

      return false
    } finally {
      await this.runWorkerEmitter.streamProcessed(
        streamInfo.tenantId,
        streamInfo.integrationType,
        streamInfo.runId,
      )
    }
  }

  private async updateIntegrationSettings(
    streamId: string,
    settings: unknown,
    runId?: string,
  ): Promise<void> {
    try {
      this.log.debug('Updating integration settings!')
      await this.repo.updateIntegrationSettings(streamId, settings)
    } catch (err) {
      if (runId) {
        await this.triggerRunError(
          streamId,
          'run-stream-update-settings',
          'Error while updating settings!',
          undefined,
          err,
        )
      }

      throw err
    }
  }

  private async publishStream(
    tenantId: string,
    platform: string,
    parentId: string,
    identifier: string,
    data?: unknown,
    runId?: string,
    webhookId?: string,
    integrationId?: string,
  ): Promise<void> {
    try {
      if (!runId && !webhookId) {
        throw new Error('Need either run id or webhook id!')
      }
      this.log.debug({ identifier }, 'Publishing new child stream!')
      if (runId) {
        // publising normal stream
        const streamId = await this.repo.publishStream(parentId, identifier, data, runId)
        if (streamId) {
          await this.streamWorkerEmitter.triggerStreamProcessing(tenantId, platform, streamId)
        } else {
          this.log.debug({ identifier }, 'Child stream already exists!')
        }
      }

      if (webhookId) {
        // publishing webhook stream
        await this.repo.publishWebhookStream(identifier, webhookId, data, integrationId, tenantId)

        await this.streamWorkerEmitter.triggerWebhookProcessing(tenantId, platform, webhookId)
      }
    } catch (err) {
      if (runId) {
        await this.triggerRunError(
          runId,
          'run-publish-child-stream',
          'Error while publishing child stream!',
          undefined,
          err,
        )
      }

      throw err
    }
  }

  private async publishData(
    tenantId: string,
    platform: string,
    streamId: string,
    data: unknown,
    runId?: string,
  ): Promise<void> {
    try {
      this.log.debug('Publishing new stream data!')
      const dataId = await this.repo.publishData(streamId, data)
      await this.dataWorkerEmitter.triggerDataProcessing(tenantId, platform, dataId)
    } catch (err) {
      if (runId) {
        await this.triggerRunError(
          runId,
          'run-publish-stream-data',
          'Error while publishing stream data!',
          undefined,
          err,
        )
      }

      throw err
    }
  }
}
