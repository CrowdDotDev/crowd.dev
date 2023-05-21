import { singleOrDefault } from '@crowd/common'
import { DbStore } from '@crowd/database'
import { IGenerateStreamsContext, INTEGRATION_SERVICES } from '@crowd/integrations'
import { Logger, LoggerBase, getChildLogger } from '@crowd/logging'
import { RedisCache, RedisClient } from '@crowd/redis'
import { IntegrationRunState } from '@crowd/types'
import { StreamWorkerEmitter } from '../queue'
import IntegrationRunRepository from '../repo/integrationRun.repo'
import SampleDataRepository from '../repo/sampleData.repo'

export default class IntegrationRunService extends LoggerBase {
  private readonly repo: IntegrationRunRepository
  private readonly sampleDataRepo: SampleDataRepository

  constructor(
    private readonly redisClient: RedisClient,
    private readonly streamWorkerEmitter: StreamWorkerEmitter,
    store: DbStore,
    parentLog: Logger,
  ) {
    super(parentLog)

    this.repo = new IntegrationRunRepository(store, this.log)
    this.sampleDataRepo = new SampleDataRepository(store, this.log)
  }

  public async generateStreams(runId: string): Promise<void> {
    this.log.info({ runId }, 'Trying to generate root streams for integration run!')

    const runInfo = await this.repo.getGenerateStreamData(runId)

    if (!runInfo) {
      this.log.error({ runId }, 'Could not find run info!')
      await this.triggerRunError(runId, 'check-run-exists', 'Could not find run info!')
      return
    }

    // we can do this because this service instance is only used for one run
    this.log = getChildLogger('run-processor', this.log, {
      runId,
      integrationId: runInfo.integrationId,
      onboarding: runInfo.onboarding,
      platform: runInfo.integrationType,
    })

    if (runInfo.streamCount > 0) {
      this.log.error({ streamCount: runInfo.streamCount }, 'Run already has streams!')
      await this.triggerRunError(runId, 'check-run-streams', 'Run already has streams!', {
        streamCount: runInfo.streamCount,
      })
      return
    }

    if (runInfo.runState !== IntegrationRunState.PENDING) {
      this.log.error({ actualState: runInfo.runState }, 'Run is not in pending state!')
      await this.triggerRunError(runId, 'check-run-state', 'Run is not in pending state!', {
        actualState: runInfo.runState,
      })
      return
    }

    const integrationService = singleOrDefault(
      INTEGRATION_SERVICES,
      (i) => i.type === runInfo.integrationType,
    )

    if (!integrationService) {
      this.log.error({ type: runInfo.integrationType }, 'Could not find integration service!')
      await this.triggerRunError(
        runId,
        'check-run-int-service',
        'Could not find integration service!',
        {
          type: runInfo.integrationType,
        },
      )
      return
    }

    if (runInfo.onboarding && runInfo.hasSampleData) {
      this.log.warn('Tenant still has sample data - deleting it now!')
      try {
        await this.sampleDataRepo.transactionally(async (txRepo) => {
          await txRepo.deleteSampleData(runInfo.tenantId)
        })
      } catch (err) {
        this.log.error({ err }, 'Error while deleting sample data!')
        await this.triggerRunError(
          runId,
          'run-delete-sample-data',
          'Error while deleting sample data!',
          undefined,
          err,
        )
        return
      }
    }

    const cache = new RedisCache(
      `int-${runInfo.tenantId}-${runInfo.integrationType}`,
      this.redisClient,
      this.log,
    )

    const context: IGenerateStreamsContext = {
      onboarding: runInfo.onboarding,

      integration: {
        id: runInfo.integrationId,
        identifier: runInfo.integrationIdentifier,
        platform: runInfo.integrationType,
        status: runInfo.integrationState,
        settings: runInfo.integrationSettings,
      },

      log: this.log,
      cache,

      abortRunWithError: async (message: string, metadata?: unknown, error?: Error) => {
        this.log.error({ message }, 'Aborting run with error!')
        await this.triggerRunError(runId, 'run-abort', message, metadata, error)
      },

      publishStream: async (identifier: string, data?: unknown) => {
        await this.publishStream(runInfo.tenantId, runInfo.integrationType, runId, identifier, data)
      },

      updateIntegrationSettings: async (settings: unknown) => {
        await this.updateIntegrationSettings(runId, settings)
      },
    }

    this.log.debug('Marking run as in progress!')
    await this.repo.markRunInProgress(runId)
    await this.repo.touchRun(runId)

    this.log.info('Generating streams!')
    try {
      await integrationService.generateStreams(context)
      this.log.info('Finished generating streams!')
    } catch (err) {
      this.log.error({ err }, 'Error while generating streams!')
      await this.triggerRunError(
        runId,
        'run-gen-streams',
        'Error while generating streams!',
        undefined,
        err,
      )
    } finally {
      await this.repo.touchRun(runId)
    }
  }

  private async updateIntegrationSettings(runId: string, settings: unknown): Promise<void> {
    try {
      this.log.debug('Updating integration settings!')
      await this.repo.updateIntegrationSettings(runId, settings)
    } catch (err) {
      await this.triggerRunError(
        runId,
        'run-update-settings',
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
    runId: string,
    identifier: string,
    data?: unknown,
  ): Promise<void> {
    try {
      this.log.debug('Publishing new root stream!')
      const streamId = await this.repo.publishStream(runId, identifier, data)
      await this.streamWorkerEmitter.triggerStreamProcessing(`${tenantId}-${platform}`, streamId)
    } catch (err) {
      await this.triggerRunError(
        runId,
        'run-publish-root-stream',
        'Error while publishing root stream!',
        undefined,
        err,
      )
      throw err
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
}
