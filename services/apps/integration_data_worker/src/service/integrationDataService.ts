import { PLATFORM_CONFIG, SLACK_ALERTING_CONFIG, WORKER_SETTINGS } from '../conf'
import { SlackAlertTypes, sendSlackAlert } from '@crowd/alerting'
import { addSeconds, singleOrDefault } from '@crowd/common'
import { DATABASE_IOC, DbStore } from '@crowd/database'
import { INTEGRATION_SERVICES, IProcessDataContext } from '@crowd/integrations'
import { LOGGING_IOC, Logger, getChildLogger } from '@crowd/logging'
import { REDIS_IOC, RedisCache, RedisClient } from '@crowd/redis'
import { SQS_IOC } from '@crowd/sqs'
import {
  IActivityData,
  IDataSinkWorkerEmitter,
  IIntegrationStreamWorkerEmitter,
  IntegrationResultType,
  IntegrationRunState,
} from '@crowd/types'
import { inject, injectable } from 'inversify'
import IntegrationDataRepository from '../repo/integrationData.repo'

@injectable()
export default class IntegrationDataService {
  private log: Logger
  private readonly repo: IntegrationDataRepository

  constructor(
    @inject(REDIS_IOC.client)
    private readonly redisClient: RedisClient,
    @inject(SQS_IOC.emitters.integrationStreamWorker)
    private readonly streamWorkerEmitter: IIntegrationStreamWorkerEmitter,
    @inject(SQS_IOC.emitters.dataSinkWorker)
    private readonly dataSinkWorkerEmitter: IDataSinkWorkerEmitter,
    @inject(DATABASE_IOC.store)
    store: DbStore,
    @inject(LOGGING_IOC.logger)
    parentLog: Logger,
  ) {
    this.log = getChildLogger('integration-data-service', parentLog)

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
      this.log.error({ dataId }, 'Data not found!')
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
          identifier,
          data,
          dataInfo.runId,
          dataInfo.webhookId,
        )
      },

      updateIntegrationSettings: async (settings) => {
        await this.updateIntegrationSettings(dataId, settings)
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

          await sendSlackAlert({
            slackURL: SLACK_ALERTING_CONFIG().url,
            alertType: SlackAlertTypes.DATA_WORKER_ERROR,
            integration: {
              id: dataInfo.integrationId,
              platform: dataInfo.integrationType,
              tenantId: dataInfo.tenantId,
              apiDataId: dataInfo.id,
            },
            userContext: {
              currentTenant: {
                name: dataInfo.name,
                plan: dataInfo.plan,
                isTrial: dataInfo.isTrialPlan,
              },
            },
            log: this.log,
            frameworkVersion: 'new',
          })
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

  private async publishStream(
    tenantId: string,
    platform: string,
    parentId: string,
    identifier: string,
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
          await this.streamWorkerEmitter.triggerStreamProcessing(tenantId, platform, streamId)
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
