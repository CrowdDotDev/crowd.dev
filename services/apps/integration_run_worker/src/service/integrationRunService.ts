import { singleOrDefault } from '@crowd/common'
import {
  IntegrationRunWorkerEmitter,
  IntegrationStreamWorkerEmitter,
  SearchSyncWorkerEmitter,
} from '@crowd/common_services'
import { DbStore } from '@crowd/data-access-layer/src/database'
import IntegrationRunRepository from '@crowd/data-access-layer/src/old/apps/integration_run_worker/integrationRun.repo'
import MemberAttributeSettingsRepository from '@crowd/data-access-layer/src/old/apps/integration_run_worker/memberAttributeSettings.repo'
import SampleDataRepository from '@crowd/data-access-layer/src/old/apps/integration_run_worker/sampleData.repo'
import { IGenerateStreamsContext, INTEGRATION_SERVICES } from '@crowd/integrations'
import { Logger, LoggerBase, getChildLogger } from '@crowd/logging'
import { ApiPubSubEmitter, RedisCache, RedisClient } from '@crowd/redis'
import { IntegrationRunState } from '@crowd/types'

import { NANGO_CONFIG, PLATFORM_CONFIG } from '../conf'

export default class IntegrationRunService extends LoggerBase {
  private readonly repo: IntegrationRunRepository
  private readonly sampleDataRepo: SampleDataRepository

  constructor(
    private readonly redisClient: RedisClient,
    private readonly streamWorkerEmitter: IntegrationStreamWorkerEmitter,
    private readonly runWorkerEmitter: IntegrationRunWorkerEmitter,
    private readonly searchSyncWorkerEmitter: SearchSyncWorkerEmitter,
    private readonly apiPubSubEmitter: ApiPubSubEmitter,
    private readonly store: DbStore,
    parentLog: Logger,
  ) {
    super(parentLog)

    this.repo = new IntegrationRunRepository(store, this.log)
    this.sampleDataRepo = new SampleDataRepository(store, this.log)
  }

  public async checkRuns(): Promise<void> {
    this.log.debug('Checking for delayed runs!')

    let runs = await this.repo.getPendingDelayedRuns(1, 10)
    while (runs.length > 0) {
      this.log.info({ runCount: runs.length }, 'Found delayed runs that need to be started!')

      for (const run of runs) {
        this.log.info({ runId: run.id }, 'Restarting delayed run!')
        await this.repo.resetDelayedRun(run.id)
        await this.streamWorkerEmitter.continueProcessingRunStreams(
          run.tenantId,
          run.onboarding,
          run.integrationType,
          run.id,
        )
      }

      runs = await this.repo.getPendingDelayedRuns(1, 10)
    }
  }

  public async startIntegrationRun(
    integrationId: string,
    onboarding: boolean,
    isManualRun?: boolean,
    manualSettings?: unknown,
    additionalInfo?: unknown,
  ): Promise<void> {
    this.log = getChildLogger('start-integration-run', this.log, {
      integrationId,
      onboarding,
    })

    this.log.info('Trying to start integration run!')

    const integrationInfo = await this.repo.getIntegrationData(integrationId)

    if (!integrationInfo) {
      this.log.error('Could not find integration info!')
      return
    }

    this.log = getChildLogger('start-integration-run', this.log, {
      integrationId,
      onboarding,
      integrationType: integrationInfo.type,
    })

    const service = singleOrDefault(INTEGRATION_SERVICES, (s) => s.type === integrationInfo.type)

    if (!service) {
      this.log.error('Integration type/platform not supported by this worker!')
      return
    }

    if (!onboarding) {
      const isAlreadyProcessing = await this.repo.isIntegrationBeingProcessed(integrationId)

      if (isAlreadyProcessing) {
        this.log.warn('Integration is already being processed!')
        return
      }
    }

    this.log.info('Creating new integration run!')
    const runId = await this.repo.createRun(integrationInfo.tenantId, integrationId, onboarding)

    this.log.info('Triggering run processing!')
    await this.runWorkerEmitter.triggerRunProcessing(
      integrationInfo.tenantId,
      integrationInfo.type,
      runId,
      onboarding,
      isManualRun,
      manualSettings,
      additionalInfo,
    )
  }

  public async generateStreams(
    runId: string,
    isManualRun?: boolean,
    manualSettings?: unknown,
    additionalInfo?: unknown,
  ): Promise<void> {
    this.log.info({ runId }, 'Trying to generate root streams for integration run!')

    const runInfo = await this.repo.getGenerateStreamData(runId)

    if (!runInfo) {
      this.log.error({ runId }, 'Could not find run info!')
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

        await this.searchSyncWorkerEmitter.triggerMemberCleanup(runInfo.tenantId)
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

    if (
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (runInfo.integrationSettings as any).updateMemberAttributes &&
      integrationService.memberAttributes.length > 0
    ) {
      this.log.warn('Integration settings contain updateMemberAttributes - updating it now!')
      await this.store.transactionally(async (txStore) => {
        const txMemberAttributeSettingsRepo = new MemberAttributeSettingsRepository(
          txStore,
          this.log,
        )
        const txRunRepo = new IntegrationRunRepository(txStore, this.log)

        await txMemberAttributeSettingsRepo.createPredefined(
          runInfo.tenantId,
          integrationService.memberAttributes,
        )

        // delete the attributes cache
        const cache = new RedisCache('memberAttributes', this.redisClient, this.log)
        await cache.delete(runInfo.tenantId)

        await txRunRepo.updateIntegrationSettings(runId, {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ...(runInfo.integrationSettings as any),
          updateMemberAttributes: false,
        })
      })
    }

    const cache = new RedisCache(
      `int-${runInfo.tenantId}-${runInfo.integrationType}`,
      this.redisClient,
      this.log,
    )

    const nangoConfig = NANGO_CONFIG()

    const context: IGenerateStreamsContext = {
      onboarding: runInfo.onboarding,
      serviceSettings: {
        nangoUrl: nangoConfig.url,
        nangoSecretKey: nangoConfig.secretKey,
        nangoId: `${runInfo.tenantId}-${runInfo.integrationType}`,
      },
      platformSettings: PLATFORM_CONFIG(runInfo.integrationType),
      integration: {
        id: runInfo.integrationId,
        identifier: runInfo.integrationIdentifier,
        platform: runInfo.integrationType,
        status: runInfo.integrationState,
        settings: runInfo.integrationSettings,
        token: runInfo.integrationToken,
        refreshToken: runInfo.integrationRefreshToken,
      },

      // this is for controling manual one off runs
      isManualRun,
      manualSettings,

      // this is mainly for github when we add new repos
      additionalInfo,

      log: this.log,
      cache,

      abortRunWithError: async (message: string, metadata?: unknown, error?: Error) => {
        this.log.error({ message }, 'Aborting run with error!')
        await this.triggerRunError(runId, 'run-abort', message, metadata, error)
      },

      publishStream: async (identifier: string, data?: unknown) => {
        await this.publishStream(
          runInfo.tenantId,
          runInfo.integrationType,
          runId,
          identifier,
          runInfo.onboarding,
          data,
        )
      },

      updateIntegrationSettings: async (settings: unknown) => {
        await this.updateIntegrationSettings(runId, settings)
      },

      updateIntegrationToken: async (token: string) => {
        await this.updateIntegrationToken(runId, token)
      },

      updateIntegrationRefreshToken: async (refreshToken: string) => {
        await this.updateIntegrationRefreshToken(runId, refreshToken)
      },
    }

    this.log.debug('Marking run as in progress!')
    await this.repo.markRunInProgress(runId)

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

  private async updateIntegrationToken(runId: string, token: string): Promise<void> {
    try {
      this.log.debug('Updating integration token!')
      await this.repo.updateIntegrationToken(runId, token)
    } catch (err) {
      await this.triggerRunError(
        runId,
        'run-update-token',
        'Error while updating token!',
        undefined,
        err,
      )
      throw err
    }
  }

  private async updateIntegrationRefreshToken(runId: string, refreshToken: string): Promise<void> {
    try {
      this.log.debug('Updating integration refresh token!')
      await this.repo.updateIntegrationRefreshToken(runId, refreshToken)
    } catch (err) {
      await this.triggerRunError(
        runId,
        'run-update-refresh-token',
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
    runId: string,
    identifier: string,
    onboarding: boolean,
    data?: unknown,
  ): Promise<void> {
    try {
      this.log.debug('Publishing new root stream!')
      const streamId = await this.repo.publishStream(runId, identifier, data)
      await this.streamWorkerEmitter.triggerStreamProcessing(
        tenantId,
        platform,
        streamId,
        onboarding,
      )
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
