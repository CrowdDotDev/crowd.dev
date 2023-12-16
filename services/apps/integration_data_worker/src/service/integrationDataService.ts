import { addSeconds, singleOrDefault } from '@crowd/common'
import { DataSinkWorkerEmitter, IntegrationStreamWorkerEmitter } from '@crowd/common_services'
import { DbStore } from '@crowd/database'
import { INTEGRATION_SERVICES, IProcessDataContext } from '@crowd/integrations'
import { Logger, LoggerBase, getChildLogger } from '@crowd/logging'
import { RedisCache, RedisClient } from '@crowd/redis'
import telemetry from '@crowd/telemetry'
import { IActivityData, IntegrationResultType, IntegrationRunState } from '@crowd/types'
import { PLATFORM_CONFIG, WORKER_SETTINGS } from '../conf'
import IntegrationDataRepository from '../repo/integrationData.repo'

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

  public async processData(dataId: string): Promise<boolean> {
    this.log.debug({ dataId }, 'Trying to process stream data!')

    const dataInfo = await this.repo.getDataInfo(dataId)

    if (!dataInfo) {
      telemetry.increment('data_sink_worker.process_data.not_found', 1)
      return
    }

    if (dataInfo.runId) {
      if (dataInfo.runState === IntegrationRunState.INTEGRATION_DELETED) {
        this.log.warn('Integration was deleted! Skipping data processing!')
        return false
      }

      this.log = getChildLogger('stream-data-processor', this.log, {
        dataId,
        streamId: dataInfo.streamId,
        runId: dataInfo.runId,
        integrationId: dataInfo.integrationId,
        onboarding: dataInfo.onboarding,
        platform: dataInfo.integrationType,
      })
    } else {
      this.log = getChildLogger('stream-data-processor', this.log, {
        dataId,
        streamId: dataInfo.streamId,
        webhookId: dataInfo.webhookId,
        integrationId: dataInfo.integrationId,
        onboarding: dataInfo.onboarding,
        platform: dataInfo.integrationType,
      })
    }

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
      return false
    }

    const cache = new RedisCache(
      `int-${dataInfo.tenantId}-${dataInfo.integrationType}`,
      this.redisClient,
      this.log,
    )

    const context: IProcessDataContext = {
      onboarding: dataInfo.onboarding !== null ? dataInfo.onboarding : undefined,
      platformSettings: PLATFORM_CONFIG(dataInfo.integrationType),
      integration: {
        id: dataInfo.integrationId,
        identifier: dataInfo.integrationIdentifier,
        platform: dataInfo.integrationType,
        status: dataInfo.integrationState,
        settings: dataInfo.integrationSettings,
        token: dataInfo.integrationToken,
        refreshToken: dataInfo.integrationRefreshToken,
      },

      data: dataInfo.data,

      log: this.log,
      cache,

      publishActivity: async (activity) => {
        await this.publishActivity(
          dataInfo.tenantId,
          dataInfo.integrationType,
          dataId,
          dataInfo.onboarding === null ? true : dataInfo.onboarding,
          activity,
        )
      },

      publishCustom: async (entity, type) => {
        await this.publishCustom(
          dataInfo.tenantId,
          dataInfo.integrationType,
          dataId,
          dataInfo.onboarding === null ? true : dataInfo.onboarding,
          type,
          entity,
        )
      },

      publishStream: async (identifier, data) => {
        await this.publishStream(
          dataInfo.tenantId,
          dataInfo.integrationType,
          dataInfo.streamId,
          identifier,
          dataInfo.onboarding === null ? true : dataInfo.onboarding,
          data,
          dataInfo.runId,
          dataInfo.webhookId,
        )
      },

      updateIntegrationSettings: async (settings) => {
        await this.updateIntegrationSettings(dataId, settings)
      },

      updateIntegrationToken: async (token: string) => {
        await this.updateIntegrationToken(dataId, token)
      },

      updateIntegrationRefreshToken: async (refreshToken: string) => {
        await this.updateIntegrationRefreshToken(dataId, refreshToken)
      },

      abortWithError: async (message: string, metadata?: unknown, error?: Error) => {
        this.log.error({ message }, 'Aborting stream processing with error!')
        await this.triggerDataError(dataId, 'data-abort', message, metadata, error)
      },

      abortRunWithError: dataInfo.runId
        ? async (message: string, metadata?: unknown, error?: Error) => {
            this.log.error({ message }, 'Aborting run with error!')
            await this.triggerRunError(dataInfo.runId, 'data-run-abort', message, metadata, error)
          }
        : undefined,
    }

    // this.log.debug('Marking data as in progress!')
    // await this.repo.markDataInProgress(dataId)

    // TODO we might need that later to check for stuck runs
    // if (dataInfo.runId) {
    //   await this.repo.touchRun(dataInfo.runId)
    // }

    this.log.debug('Processing data!')
    try {
      await integrationService.processData(context)
      this.log.debug('Finished processing data!')
      await this.repo.deleteData(dataId)
      return true
    } catch (err) {
      this.log.error(err, 'Error while processing stream!')
      try {
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
          if (dataInfo.runId) {
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
        }
      } catch (err2) {
        this.log.error(err2, 'Error while handling stream error!')

        return false
      }
    }

    // TODO we might need that later to check for stuck runs
    // finally {
    //   if (dataInfo.runId) {
    //     await this.repo.touchRun(dataInfo.runId)
    //   }
    // }
  }

  private async publishCustom(
    tenantId: string,
    platform: string,
    dataId: string,
    onboarding: boolean,
    type: IntegrationResultType,
    entity: unknown,
  ): Promise<void> {
    this.log.debug(`Publishing entity with custom type!`)

    try {
      const resultId = await this.repo.publishResult(dataId, {
        type,
        data: entity,
      })
      await this.dataSinkWorkerEmitter.triggerResultProcessing(
        tenantId,
        platform,
        resultId,
        resultId,
        onboarding,
      )
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
    onboarding: boolean,
    activity: IActivityData,
  ): Promise<void> {
    try {
      this.log.debug('Publishing activity!')
      const resultId = await this.repo.publishResult(dataId, {
        type: IntegrationResultType.ACTIVITY,
        data: activity,
      })
      await this.dataSinkWorkerEmitter.triggerResultProcessing(
        tenantId,
        platform,
        resultId,
        activity.sourceId,
        onboarding,
      )
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

  private async updateIntegrationToken(dataId: string, token: string): Promise<void> {
    try {
      this.log.debug('Updating integration token!')
      await this.repo.updateIntegrationToken(dataId, token)
    } catch (err) {
      await this.triggerRunError(
        dataId,
        'run-data-update-token',
        'Error while updating token!',
        undefined,
        err,
      )
      throw err
    }
  }

  private async updateIntegrationRefreshToken(dataId: string, refreshToken: string): Promise<void> {
    try {
      this.log.debug('Updating integration refresh token!')
      await this.repo.updateIntegrationRefreshToken(dataId, refreshToken)
    } catch (err) {
      await this.triggerRunError(
        dataId,
        'run-data-update-refresh-token',
        'Error while updating refresh token!',
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
    identifier: string,
    onboarding: boolean,
    data?: unknown,
    runId?: string,
    webhookId?: string,
  ): Promise<void> {
    try {
      this.log.debug({ identifier }, 'Publishing new child stream!')
      if (!runId && !webhookId) {
        throw new Error('Need either runId or webhookId!')
      }

      const streamId = await this.repo.publishStream(parentId, identifier, data, runId, webhookId)
      if (streamId) {
        if (runId) {
          await this.streamWorkerEmitter.triggerStreamProcessing(
            tenantId,
            platform,
            streamId,
            onboarding,
          )
        } else if (webhookId) {
          await this.streamWorkerEmitter.triggerWebhookProcessing(tenantId, platform, webhookId)
        } else {
          this.log.error(
            { tenantId, platform, parentId, identifier, runId, webhookId },
            'Need either runId or webhookId!',
          )
          throw new Error('Need either runId or webhookId!')
        }
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
