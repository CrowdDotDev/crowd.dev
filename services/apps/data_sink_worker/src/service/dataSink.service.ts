import { DbStore } from '@crowd/database'
import { Logger, LoggerBase, getChildLogger } from '@crowd/logging'
import { IActivityData, IntegrationResultState, IntegrationResultType } from '@crowd/types'
import DataSinkRepository from '../repo/dataSink.repo'
import ActivityService from './activity.service'
import { NodejsWorkerEmitter, SearchSyncWorkerEmitter } from '@crowd/sqs'

export default class DataSinkService extends LoggerBase {
  private readonly repo: DataSinkRepository

  constructor(
    private readonly store: DbStore,
    private readonly nodejsWorkerEmitter: NodejsWorkerEmitter,
    private readonly searchSyncWorkerEmitter: SearchSyncWorkerEmitter,
    parentLog: Logger,
  ) {
    super(parentLog)

    this.repo = new DataSinkRepository(store, this.log)
  }

  private async triggerResultError(
    resultId: string,
    location: string,
    message: string,
    metadata?: unknown,
    error?: Error,
  ): Promise<void> {
    await this.repo.markResultError(resultId, {
      location,
      message,
      metadata,
      errorMessage: error?.message,
      errorStack: error?.stack,
      errorString: error ? JSON.stringify(error) : undefined,
    })
  }

  public async processResult(resultId: string): Promise<void> {
    this.log.debug({ resultId }, 'Processing result.')

    const resultInfo = await this.repo.getResultInfo(resultId)

    if (!resultInfo) {
      this.log.error({ resultId }, 'Result not found.')
      return
    }

    this.log = getChildLogger('result-processor', this.log, {
      resultId,
      apiDataId: resultInfo.apiDataId,
      streamId: resultInfo.streamId,
      runId: resultInfo.runId,
      integrationId: resultInfo.integrationId,
      platform: resultInfo.platform,
    })

    if (resultInfo.state !== IntegrationResultState.PENDING) {
      this.log.error({ actualState: resultInfo.state }, 'Result is not pending.')
      await this.triggerResultError(resultId, 'check-result-state', 'Result is not pending.', {
        actualState: resultInfo.state,
      })
      return
    }

    this.log.debug('Marking result as in progress.')
    await this.repo.markResultInProgress(resultId)
    await this.repo.touchRun(resultInfo.runId)

    try {
      const data = resultInfo.data
      switch (data.type) {
        case IntegrationResultType.ACTIVITY: {
          const service = new ActivityService(
            this.store,
            this.nodejsWorkerEmitter,
            this.searchSyncWorkerEmitter,
            this.log,
          )
          const activityData = data.data as IActivityData

          await service.processActivity(
            resultInfo.tenantId,
            resultInfo.integrationId,
            resultInfo.platform,
            activityData,
          )
          break
        }

        default: {
          throw new Error(`Unknown result type: ${data.type}`)
        }
      }
      await this.repo.markResultProcessed(resultId)
    } catch (err) {
      this.log.error(err, 'Error processing result.')
      await this.triggerResultError(
        resultId,
        'process-result',
        'Error processing result.',
        undefined,
        err,
      )
    } finally {
      await this.repo.touchRun(resultInfo.runId)
    }
  }
}
