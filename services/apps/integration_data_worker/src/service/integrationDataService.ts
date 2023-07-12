import { DbStore } from '@crowd/database'
import { Logger, LoggerBase, getChildLogger } from '@crowd/logging'
import { RedisCache, RedisClient } from '@crowd/redis'
import IntegrationDataRepository from '../repo/integrationData.repo'
import { IActivityData, IntegrationResultType, IntegrationRunState } from '@crowd/types'
import { addSeconds, singleOrDefault } from '@crowd/common'
import { INTEGRATION_SERVICES, IProcessDataContext } from '@crowd/integrations'
import { WORKER_SETTINGS, PLATFORM_CONFIG } from '@/conf'
import { DataSinkWorkerEmitter, IntegrationStreamWorkerEmitter } from '@crowd/sqs'

export default class IntegrationDataService extends LoggerBase {
  private readonly repo: IntegrationDataRepository

  constructor(
    private readonly redisClient: RedisClient,
    private readonly streamWorkerEmitter: IntegrationStreamWorkerEmitter,
    private readonly dataSinkWorkerEmitter: DataSinkWorkerEmitter,
    store: DbStore,
    parentLog: Logger,
  ) {
    super(parentLog)

    this.repo = new IntegrationDataRepository(store, this.log)
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

  private async triggerDataError(
    dataId: string,
    location: string,
    message: string,
    metadata?: unknown,
    error?: Error,
  ): Promise<void> {
    await this.repo.markDataError(dataId, {
      location,
      message,
      metadata,
      errorMessage: error?.message,
      errorStack: error?.stack,
      errorString: error ? JSON.stringify(error) : undefined,
    })
  }

  public async processData(dataId: string): Promise<void> {
    this.log.debug({ dataId }, 'Trying to process stream data!')

    const dataInfo = await this.repo.getDataInfo(dataId)

    if (!dataInfo) {
      this.log.error({ dataId }, 'Data not found!')
      return
    }

    if (dataInfo.runState === IntegrationRunState.INTEGRATION_DELETED) {
      this.log.warn('Integration was deleted! Skipping data processing!')
      return
    }

    this.log = getChildLogger('stream-data-processor', this.log, {
      dataId,
      streamId: dataInfo.streamId,
      runId: dataInfo.runId,
      integrationId: dataInfo.integrationId,
      onboarding: dataInfo.onboarding,
      platform: dataInfo.integrationType,
    })

    const integrationService = singleOrDefault(
      INTEGRATION_SERVICES,
      (i) => i.type === dataInfo.integrationType,
    )

    if (!integrationService) {
      this.log.error({ type: dataInfo.integrationType }, 'Could not find integration service!')
      await this.triggerDataError(
        dataId,
        'check-data-int-service',
        'Could not find integration service!',
        {
          type: dataInfo.integrationType,
        },
      )
      return
    }

    const cache = new RedisCache(
      `int-${dataInfo.tenantId}-${dataInfo.integrationType}`,
      this.redisClient,
      this.log,
    )

    const context: IProcessDataContext = {
      onboarding: dataInfo.onboarding,
      platformSettings: PLATFORM_CONFIG(dataInfo.integrationType),
      integration: {
        id: dataInfo.integrationId,
        identifier: dataInfo.integrationIdentifier,
        platform: dataInfo.integrationType,
        status: dataInfo.integrationState,
        settings: dataInfo.integrationSettings,
      },

      data: dataInfo.data,

      log: this.log,
      cache,

      publishActivity: async (activity) => {
        await this.publishActivity(dataInfo.tenantId, dataInfo.integrationType, dataId, activity)
      },

      publishCustom: async (entity, type) => {
        await this.publishCustom(dataInfo.tenantId, dataInfo.integrationType, dataId, type, entity)
      },

      publishStream: async (identifier, data) => {
        await this.publishStream(
          dataInfo.tenantId,
          dataInfo.integrationType,
          dataInfo.streamId,
          dataInfo.runId,
          identifier,
          data,
        )
      },

      updateIntegrationSettings: async (settings) => {
        await this.updateIntegrationSettings(dataId, settings)
      },

      abortWithError: async (message: string, metadata?: unknown, error?: Error) => {
        this.log.error({ message }, 'Aborting stream processing with error!')
        await this.triggerDataError(dataId, 'data-abort', message, metadata, error)
      },
      abortRunWithError: async (message: string, metadata?: unknown, error?: Error) => {
        this.log.error({ message }, 'Aborting run with error!')
        await this.triggerRunError(dataInfo.runId, 'data-run-abort', message, metadata, error)
      },
    }

    this.log.debug('Marking data as in progress!')
    await this.repo.markDataInProgress(dataId)
    await this.repo.touchRun(dataInfo.runId)
    this.log.debug('Processing data!')
    try {
      await integrationService.processData(context)
      this.log.debug('Finished processing data!')
      await this.repo.markDataProcessed(dataId)
    } catch (err) {
      this.log.error(err, 'Error while processing stream!')
      await this.triggerDataError(
        dataId,
        'data-process',
        'Error while processing data!',
        undefined,
        err,
      )

      if (dataInfo.retries + 1 <= WORKER_SETTINGS().maxDataRetries) {
        // delay for #retries * 15 minutes
        const until = addSeconds(new Date(), (dataInfo.retries + 1) * 15 * 60)
        this.log.warn({ until: until.toISOString() }, 'Retrying stream!')
        await this.repo.delayData(dataId, until)
      } else {
        // stop run because of stream error
        this.log.warn('Reached maximum retries for data! Stopping the run!')
        await this.triggerRunError(
          dataInfo.runId,
          'data-run-stop',
          'Data reached maximum retries!',
          {
            retries: dataInfo.retries + 1,
            maxRetries: WORKER_SETTINGS().maxDataRetries,
          },
        )
      }
    } finally {
      await this.repo.touchRun(dataInfo.runId)
    }
  }

  private async publishCustom(
    tenantId: string,
    platform: string,
    dataId: string,
    type: IntegrationResultType,
    entity: unknown,
  ): Promise<void> {
    this.log.debug(`Publishing entity with custom type!`)

    try {
      const resultId = await this.repo.publishResult(dataId, {
        type,
        data: entity,
      })
      await this.dataSinkWorkerEmitter.triggerResultProcessing(tenantId, platform, resultId)
    } catch (err) {
      await this.triggerDataError(
        dataId,
        'run-data-publish-custom',
        'Error while publishing entity with custom type!',
        {
          entity,
        },
      )
    }
  }

  private async publishActivity(
    tenantId: string,
    platform: string,
    dataId: string,
    activity: IActivityData,
  ): Promise<void> {
    try {
      this.log.debug('Publishing activity!')
      const resultId = await this.repo.publishResult(dataId, {
        type: IntegrationResultType.ACTIVITY,
        data: activity,
      })
      await this.dataSinkWorkerEmitter.triggerResultProcessing(tenantId, platform, resultId)
    } catch (err) {
      await this.triggerDataError(
        dataId,
        'run-data-publish-activity',
        'Error while publishing activity!',
        {
          activity,
        },
      )
    }
  }

  private async updateIntegrationSettings(dataId: string, settings: unknown): Promise<void> {
    try {
      this.log.debug('Updating integration settings!')
      await this.repo.updateIntegrationSettings(dataId, settings)
    } catch (err) {
      await this.triggerRunError(
        dataId,
        'run-data-update-settings',
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
        'run-data-publish-child-stream',
        'Error while publishing child stream!',
        undefined,
        err,
      )
      throw err
    }
  }
}
