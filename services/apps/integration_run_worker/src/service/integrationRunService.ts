import { singleOrDefault } from '@crowd/common'
import { DbStore } from '@crowd/database'
import { INTEGRATION_SERVICES, IGenerateStreamsContext } from '@crowd/integrations'
import { Logger, LoggerBase, getChildLogger } from '@crowd/logging'
import { RedisCache, RedisClient } from '@crowd/redis'
import { IIntegrationStream, IntegrationRunState, IntegrationStreamType } from '@crowd/types'
import IntegrationRunRepository from '../repo/integrationRun.repo'
import { StreamWorkerSender } from '../queue'
import { SqsClient } from '@crowd/sqs'

export default class IntegrationRunService extends LoggerBase {
  private readonly integrationRunRepo: IntegrationRunRepository
  private readonly streamWorkerSender: StreamWorkerSender

  constructor(
    private readonly redisClient: RedisClient,
    sqsClient: SqsClient,
    store: DbStore,
    parentLog: Logger,
  ) {
    super(parentLog)

    this.integrationRunRepo = new IntegrationRunRepository(store, this.log)
    this.streamWorkerSender = new StreamWorkerSender(sqsClient, this.log)
  }

  public async generateStreams(runId: string): Promise<void> {
    this.log.info({ runId }, 'Trying to generate root streams for integration run!')

    const runInfo = await this.integrationRunRepo.getGenerateStreamData(runId)

    if (!runInfo) {
      this.log.error({ runId }, 'Could not find run info!')
      await this.triggerRunError(runId, 'check-run-exists', 'Could not find run info!')
      return
    }

    // we can do this because this service instance is only used for one run
    this.log = getChildLogger(`integration-run-${runId}`, this.log, {
      runId,
      onboarding: runInfo.onboarding,
      type: runInfo.integrationType,
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

    const cache = new RedisCache(`integration-run-${runId}`, this.redisClient, this.log)

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

      abortWithError: async (message: string, metadata?: unknown) => {
        this.log.error({ message }, 'Aborting run with error!')
        await this.triggerRunError(runId, 'run-abort', message, metadata)
      },

      publishStream: async (identifier: string, metadata?: unknown) => {
        await this.publishStream(runInfo.tenantId, runId, {
          identifier,
          type: IntegrationStreamType.ROOT,
          metadata,
        })
      },

      updateIntegrationSettings: async (settings: unknown) => {
        await this.updateIntegrationSettings(runId, settings)
      },
    }

    this.log.info({ runId }, 'Marking run as in progress!')
    await this.integrationRunRepo.markRunInProgress(runId)

    this.log.info({ runId }, 'Generating streams!')
    try {
      await integrationService.generateStreams(context)
    } catch (err) {
      this.log.error({ err }, 'Error while generating streams!')
      await this.triggerRunError(runId, 'run-gen-streams', 'Error while generating streams!', {
        error: err,
      })
      return
    }
  }

  private async updateIntegrationSettings(runId: string, settings: unknown): Promise<void> {
    try {
      this.log.debug('Updating integration settings!')
      await this.integrationRunRepo.updateIntegrationSettings(runId, settings)
    } catch (err) {
      await this.triggerRunError(runId, 'run-update-settings', 'Error while updating settings!', {
        error: err,
      })
      throw err
    }
  }

  private async publishStream(
    tenantId: string,
    runId: string,
    stream: IIntegrationStream,
  ): Promise<void> {
    try {
      this.log.debug('Publishing new root stream!')
      const streamId = await this.integrationRunRepo.publishStream(runId, stream)
      await this.streamWorkerSender.triggerStreamProcessing(tenantId, streamId)
    } catch (err) {
      await this.triggerRunError(runId, 'run-publish-stream', 'Error while publishing stream!', {
        error: err,
      })
      throw err
    }
  }

  private async triggerRunError(
    runId: string,
    location: string,
    message: string,
    metadata?: unknown,
  ): Promise<void> {
    await this.integrationRunRepo.markRunError(runId, {
      location,
      message,
      metadata,
    })
  }
}
