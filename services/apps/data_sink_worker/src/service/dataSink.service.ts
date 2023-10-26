import { DbStore } from '@crowd/database'
import { Logger, LoggerBase, getChildLogger } from '@crowd/logging'
import { RedisClient } from '@crowd/redis'
import { NodejsWorkerEmitter } from '@crowd/sqs'
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
import { SearchSyncApiClient } from '@crowd/httpclients'

export default class DataSinkService extends LoggerBase {
  private readonly repo: DataSinkRepository

  constructor(
    private readonly store: DbStore,
    private readonly nodejsWorkerEmitter: NodejsWorkerEmitter,
    private readonly redisClient: RedisClient,
    private readonly searchSyncApi: SearchSyncApiClient,
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
      this.log.error({ resultId }, 'Result not found.')
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
      switch (data.type) {
        case IntegrationResultType.ACTIVITY: {
          const service = new ActivityService(
            this.store,
            this.nodejsWorkerEmitter,
            this.redisClient,
            this.searchSyncApi,
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
            this.searchSyncApi,
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

        default: {
          throw new Error(`Unknown result type: ${data.type}`)
        }
      }
      await this.repo.deleteResult(resultId)
      return true
    } catch (err) {
      this.log.error(err, 'Error processing result.')
      try {
        await this.triggerResultError(
          resultId,
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
