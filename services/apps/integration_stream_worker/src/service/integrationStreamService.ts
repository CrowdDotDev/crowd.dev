import { singleOrDefault, addSeconds } from '@crowd/common'
import { DbStore } from '@crowd/database'
import { Logger, LoggerBase, getChildLogger } from '@crowd/logging'
import { RedisCache, RedisClient } from '@crowd/redis'
import IntegrationStreamRepository from '../repo/integrationStream.repo'
import { IntegrationStreamType, RateLimitError } from '@crowd/types'
import { INTEGRATION_SERVICES, IProcessStreamContext } from '@crowd/integrations'
import { NANGO_CONFIG, WORKER_SETTINGS, PLATFORM_CONFIG } from '../conf'
import {
  IntegrationDataWorkerEmitter,
  IntegrationRunWorkerEmitter,
  IntegrationStreamWorkerEmitter,
} from '@crowd/sqs'

export default class IntegrationStreamService extends LoggerBase {
  private readonly repo: IntegrationStreamRepository

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
    streamId: string,
    location: string,
    message: string,
    metadata?: unknown,
    error?: Error,
  ): Promise<void> {
    await this.repo.markStreamError(streamId, {
      location,
      message,
      metadata,
      errorMessage: error?.message,
      errorStack: error?.stack,
      errorString: error ? JSON.stringify(error) : undefined,
    })
  }

  public async processStream(streamId: string): Promise<void> {
    this.log.debug({ streamId }, 'Trying to process stream!')

    const streamInfo = await this.repo.getStreamData(streamId)

    if (!streamInfo) {
      this.log.error({ streamId }, 'Stream not found!')
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
        streamId,
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
      },

      stream: {
        identifier: streamInfo.identifier,
        type: streamInfo.parentId ? IntegrationStreamType.CHILD : IntegrationStreamType.ROOT,
        data: streamInfo.data,
      },

      log: this.log,
      cache,

      publishData: async (data) => {
        await this.publishData(
          streamInfo.tenantId,
          streamInfo.integrationType,
          streamInfo.runId,
          streamId,
          data,
        )
      },
      publishStream: async (identifier, data) => {
        await this.publishStream(
          streamInfo.tenantId,
          streamInfo.integrationType,
          streamId,
          streamInfo.runId,
          identifier,
          data,
        )
      },
      updateIntegrationSettings: async (settings) => {
        await this.updateIntegrationSettings(streamId, settings)
      },

      abortWithError: async (message: string, metadata?: unknown, error?: Error) => {
        this.log.error({ message }, 'Aborting stream processing with error!')
        await this.triggerStreamError(streamId, 'stream-abort', message, metadata, error)
      },
      abortRunWithError: async (message: string, metadata?: unknown, error?: Error) => {
        this.log.error({ message }, 'Aborting run with error!')
        await this.triggerRunError(streamInfo.runId, 'stream-run-abort', message, metadata, error)
      },
    }

    this.log.debug('Marking stream as in progress!')
    await this.repo.markStreamInProgress(streamId)
    await this.repo.touchRun(streamInfo.runId)

    this.log.debug('Processing stream!')
    try {
      await integrationService.processStream(context)
      this.log.debug('Finished processing stream!')
      await this.repo.markStreamProcessed(streamId)
    } catch (err) {
      if (err instanceof RateLimitError) {
        const until = addSeconds(new Date(), err.rateLimitResetSeconds)
        this.log.error(
          { until: until.toISOString() },
          'Rate limit error detected - pausing entire run!',
        )
        await this.repo.resetStream(streamId)
        await this.repo.delayRun(streamInfo.runId, until)
      } else {
        this.log.error(err, 'Error while processing stream!')
        await this.triggerStreamError(
          streamId,
          'stream-process',
          'Error while processing stream!',
          undefined,
          err,
        )

        if (streamInfo.retries + 1 <= WORKER_SETTINGS().maxStreamRetries) {
          // delay for #retries * 15 minutes
          const until = addSeconds(new Date(), (streamInfo.retries + 1) * 15 * 60)
          this.log.warn({ until: until.toISOString() }, 'Retrying stream!')
          await this.repo.delayStream(streamId, until)
        } else {
          // stop run because of stream error
          this.log.warn('Reached maximum retries for stream! Stopping the run!')
          await this.triggerRunError(
            streamInfo.runId,
            'stream-run-stop',
            'Stream reached maximum retries!',
            {
              retries: streamInfo.retries + 1,
              maxRetries: WORKER_SETTINGS().maxStreamRetries,
            },
          )
        }
      }
    } finally {
      await this.repo.touchRun(streamInfo.runId)
      await this.runWorkerEmitter.streamProcessed(
        streamInfo.tenantId,
        streamInfo.integrationType,
        streamInfo.runId,
      )
    }
  }

  private async updateIntegrationSettings(streamId: string, settings: unknown): Promise<void> {
    try {
      this.log.debug('Updating integration settings!')
      await this.repo.updateIntegrationSettings(streamId, settings)
    } catch (err) {
      await this.triggerRunError(
        streamId,
        'run-stream-update-settings',
        'Error while updating settings!',
        undefined,
        err,
      )
      throw err
    }
  }

  private async publishStream(
    tenantId: string,
    platform: string,
    parentId: string,
    runId: string,
    identifier: string,
    data?: unknown,
  ): Promise<void> {
    try {
      this.log.debug({ identifier }, 'Publishing new child stream!')
      const streamId = await this.repo.publishStream(parentId, runId, identifier, data)
      if (streamId) {
        await this.streamWorkerEmitter.triggerStreamProcessing(tenantId, platform, streamId)
      } else {
        this.log.debug({ identifier }, 'Child stream already exists!')
      }
    } catch (err) {
      await this.triggerRunError(
        runId,
        'run-publish-child-stream',
        'Error while publishing child stream!',
        undefined,
        err,
      )
      throw err
    }
  }

  private async publishData(
    tenantId: string,
    platform: string,
    runId: string,
    streamId: string,
    data: unknown,
  ): Promise<void> {
    try {
      this.log.debug('Publishing new stream data!')
      const dataId = await this.repo.publishData(streamId, data)
      await this.dataWorkerEmitter.triggerDataProcessing(tenantId, platform, dataId)
    } catch (err) {
      await this.triggerRunError(
        runId,
        'run-publish-stream-data',
        'Error while publishing stream data!',
        undefined,
        err,
      )
      throw err
    }
  }
}
