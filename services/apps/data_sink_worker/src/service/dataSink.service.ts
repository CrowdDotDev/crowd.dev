import { DbStore } from '@crowd/database'
import { Logger, LoggerBase, getChildLogger } from '@crowd/logging'
import {
  IActivityData,
  IMemberData,
  IOrganization,
  IntegrationResultState,
  IntegrationResultType,
} from '@crowd/types'
import DataSinkRepository from '../repo/dataSink.repo'
import ActivityService from './activity.service'
import { NodejsWorkerEmitter, SearchSyncWorkerEmitter } from '@crowd/sqs'
import MemberService from './member.service'
import { SLACK_ALERTING_CONFIG } from '@/conf'
import { sendSlackAlert, SlackAlertTypes } from '@crowd/alerting'
import { OrganizationService } from './organization.service'

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
      webhookId: resultInfo.webhookId,
      integrationId: resultInfo.integrationId,
      platform: resultInfo.platform,
    })

    if (resultInfo.state !== IntegrationResultState.PENDING) {
      this.log.warn({ actualState: resultInfo.state }, 'Result is not pending.')
      if (resultInfo.state === IntegrationResultState.PROCESSED) {
        this.log.warn('Result has already been processed. Skipping...')
        return
      }

      await this.repo.resetResults([resultId])
      return
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

        case IntegrationResultType.MEMBER_ENRICH: {
          const service = new MemberService(
            this.store,
            this.nodejsWorkerEmitter,
            this.searchSyncWorkerEmitter,
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
    } catch (err) {
      this.log.error(err, 'Error processing result.')
      await this.triggerResultError(
        resultId,
        'process-result',
        'Error processing result.',
        undefined,
        err,
      )

      await sendSlackAlert({
        slackURL: SLACK_ALERTING_CONFIG().url,
        alertType: SlackAlertTypes.SINK_WORKER_ERROR,
        integration: {
          id: resultInfo.integrationId,
          platform: resultInfo.platform,
          tenantId: resultInfo.tenantId,
          resultId: resultInfo.id,
          apiDataId: resultInfo.apiDataId,
        },
        userContext: {
          currentTenant: {
            name: resultInfo.name,
            plan: resultInfo.plan,
            isTrial: resultInfo.isTrialPlan,
          },
        },
        log: this.log,
        frameworkVersion: 'new',
      })
    }
  }
}
