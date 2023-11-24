import { DbStore } from '@crowd/database'
import { Logger, LoggerBase, getChildLogger } from '@crowd/logging'
import { RedisClient } from '@crowd/redis'
import { NodejsWorkerEmitter, SearchSyncWorkerEmitter, DataSinkWorkerEmitter } from '@crowd/sqs'
import {
  IActivityData,
  IMemberData,
  IOrganization,
  IntegrationResultState,
  IntegrationResultType,
  PlatformType,
} from '@crowd/types'
import DataSinkRepository from '../repo/dataSink.repo'
import ActivityService from './activity.service'
import MemberService from './member.service'
import { OrganizationService } from './organization.service'
import { Unleash } from '@crowd/feature-flags'
import { Client as TemporalClient } from '@crowd/temporal'
import { IResultData } from '../repo/dataSink.data'
import { addSeconds } from '@crowd/common'
import { WORKER_SETTINGS } from '../conf'
import telemetry from '@crowd/telemetry'

export default class DataSinkService extends LoggerBase {
  private readonly repo: DataSinkRepository

  constructor(
    private readonly store: DbStore,
    private readonly nodejsWorkerEmitter: NodejsWorkerEmitter,
    private readonly searchSyncWorkerEmitter: SearchSyncWorkerEmitter,
    private readonly dataSinkWorkerEmitter: DataSinkWorkerEmitter,
    private readonly redisClient: RedisClient,
    private readonly unleash: Unleash | undefined,
    private readonly temporal: TemporalClient,
    parentLog: Logger,
  ) {
    super(parentLog)

    this.repo = new DataSinkRepository(store, this.log)
  }

  private async triggerResultError(
    resultInfo: IResultData,
    location: string,
    message: string,
    metadata?: unknown,
    error?: Error,
  ): Promise<void> {
    await this.repo.markResultError(resultInfo.id, {
      location,
      message,
      metadata,
      errorMessage: error?.message,
      errorStack: error?.stack,
      errorString: error ? JSON.stringify(error) : undefined,
    })

    if (resultInfo.retries + 1 <= WORKER_SETTINGS().maxStreamRetries) {
      // delay for #retries * 2 minutes
      const until = addSeconds(new Date(), (resultInfo.retries + 1) * 2 * 60)
      this.log.warn({ until: until.toISOString() }, 'Retrying result!')
      await this.repo.delayResult(resultInfo.id, until)
    }
  }

  public async checkResults(): Promise<void> {
    this.log.info('Checking for delayed results!')

    let results = await this.repo.transactionally(async (txRepo) => {
      return await txRepo.getDelayedResults(10)
    })

    while (results.length > 0) {
      this.log.info({ count: results.length }, 'Found delayed results!')

      for (const result of results) {
        this.log.info({ resultId: result.id }, 'Restarting delayed stream!')
        await this.repo.resetResults([result.id])
        await this.dataSinkWorkerEmitter.triggerResultProcessing(
          result.tenantId,
          result.platform,
          result.id,
          result.id,
          `${result.id}-delayed-${Date.now()}`,
        )
      }

      results = await this.repo.transactionally(async (txRepo) => {
        return await txRepo.getDelayedResults(10)
      })
    }
  }

  public async createAndProcessActivityResult(
    tenantId: string,
    segmentId: string,
    integrationId: string,
    data: IActivityData,
  ): Promise<void> {
    this.log.debug({ tenantId, segmentId }, 'Creating and processing activity result.')

    const resultId = await this.repo.createResult(tenantId, integrationId, {
      type: IntegrationResultType.ACTIVITY,
      data,
      segmentId,
    })

    await this.processResult(resultId)
  }

  public async processResult(resultId: string): Promise<boolean> {
    this.log.debug({ resultId }, 'Processing result.')

    const resultInfo = await this.repo.getResultInfo(resultId)

    if (!resultInfo) {
      telemetry.increment('data_sync_worker.result_not_found', 1)
      return false
    }

    this.log = getChildLogger('result-processor', this.log, {
      resultId,
      apiDataId: resultInfo.apiDataId,
      streamId: resultInfo.streamId,
      runId: resultInfo.runId,
      webhookId: resultInfo.webhookId,
      integrationId: resultInfo.integrationId,
      platform: resultInfo.platform,
    })

    if (resultInfo.state !== IntegrationResultState.PENDING) {
      this.log.warn({ actualState: resultInfo.state }, 'Result is not pending.')
      if (resultInfo.state === IntegrationResultState.PROCESSED) {
        this.log.warn('Result has already been processed. Skipping...')
        return false
      }

      await this.repo.resetResults([resultId])
      return false
    }

    // this.log.debug('Marking result as in progress.')
    // await this.repo.markResultInProgress(resultId)

    try {
      const data = resultInfo.data
      await telemetry.measure(
        'data_sink_worker.process_result',
        async () => {
          switch (data.type) {
            case IntegrationResultType.ACTIVITY: {
              const service = new ActivityService(
                this.store,
                this.nodejsWorkerEmitter,
                this.searchSyncWorkerEmitter,
                this.redisClient,
                this.unleash,
                this.temporal,
                this.log,
              )
              const activityData = data.data as IActivityData

              const platform = (activityData.platform ?? resultInfo.platform) as PlatformType

              await service.processActivity(
                resultInfo.tenantId,
                resultInfo.integrationId,
                platform,
                activityData,
                data.segmentId,
              )
              break
            }

            case IntegrationResultType.MEMBER_ENRICH: {
              const service = new MemberService(
                this.store,
                this.nodejsWorkerEmitter,
                this.searchSyncWorkerEmitter,
                this.unleash,
                this.temporal,
                this.redisClient,
                this.log,
              )
              const memberData = data.data as IMemberData

              await service.processMemberEnrich(
                resultInfo.tenantId,
                resultInfo.integrationId,
                resultInfo.platform,
                memberData,
              )
              break
            }

            case IntegrationResultType.ORGANIZATION_ENRICH: {
              const service = new OrganizationService(this.store, this.log)
              const organizationData = data.data as IOrganization

              await service.processOrganizationEnrich(
                resultInfo.tenantId,
                resultInfo.integrationId,
                resultInfo.platform,
                organizationData,
              )
              break
            }

            case IntegrationResultType.TWITTER_MEMBER_REACH: {
              const service = new MemberService(
                this.store,
                this.nodejsWorkerEmitter,
                this.searchSyncWorkerEmitter,
                this.unleash,
                this.temporal,
                this.redisClient,
                this.log,
              )
              const memberData = data.data as IMemberData

              await service.processMemberUpdate(
                resultInfo.tenantId,
                resultInfo.integrationId,
                resultInfo.platform,
                memberData,
              )
              break
            }

            default: {
              throw new Error(`Unknown result type: ${data.type}`)
            }
          }
        },
        {
          type: data.type,
        },
      )
      await this.repo.deleteResult(resultId)
      return true
    } catch (err) {
      this.log.error(err, 'Error processing result.')
      try {
        await this.triggerResultError(
          resultInfo,
          'process-result',
          'Error processing result.',
          undefined,
          err,
        )
      } catch (err2) {
        this.log.error(err2, 'Error triggering result error.')
      }

      return false
    }
  }
}
