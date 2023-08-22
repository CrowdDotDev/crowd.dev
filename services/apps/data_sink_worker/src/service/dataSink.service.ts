import { DbStore } from '@crowd/database'
import { Logger, LoggerBase, getChildLogger, logExecutionTimeV2 } from '@crowd/logging'
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

    const resultInfo = await logExecutionTimeV2(
      () => this.repo.getResultInfo(resultId),
      this.log,
      'DataSinkRepo.getResultInfo',
    )


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

    this.log.debug('Marking result as in progress.')
    await this.repo.markResultInProgress(resultId)
    if (resultInfo.runId) {
      await this.repo.touchRun(resultInfo.runId)
    }

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

          await logExecutionTimeV2(
            () => service.processActivity(
              resultInfo.tenantId,
              resultInfo.integrationId,
              resultInfo.platform,
              activityData,
            ),
            this.log,
            'ActivityService.processActivity',
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

          await logExecutionTimeV2(
            () => service.processMemberEnrich(
              resultInfo.tenantId,
              resultInfo.integrationId,
              resultInfo.platform,
              memberData,
            ),
            this.log,
            'MemberService.processMemberEnrich',
          )
          break
        }

        case IntegrationResultType.ORGANIZATION_ENRICH: {
          const service = new OrganizationService(this.store, this.log)
          const organizationData = data.data as IOrganization

          await logExecutionTimeV2(
            () => service.processOrganizationEnrich(
              resultInfo.tenantId,
              resultInfo.integrationId,
              resultInfo.platform,
              organizationData,
            ),
            this.log,
            'OrganizationService.processOrganizationEnrich',
          )
          break
        }

        default: {
          throw new Error(`Unknown result type: ${data.type}`)
        }
      }
      await logExecutionTimeV2(
        () => this.repo.deleteResult(resultId),
        this.log,
        'DataSinkRepo.deleteResult',
      )
    } catch (err) {
      this.log.error(err, 'Error processing result.')
      await logExecutionTimeV2(
        () => this.triggerResultError(
          resultId,
          'process-result',
          'Error processing result.',
          undefined,
          err,
        ),
        this.log,
        'DataSinkService.triggerResultError',
      )

      await logExecutionTimeV2(
        () => sendSlackAlert({
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
        }),
        this.log,
        'DataSinkService -> sendSlackAlert',
      )
    } finally {
      if (resultInfo.runId) {
        await logExecutionTimeV2(
          () => this.repo.touchRun(resultInfo.runId),
          this.log,
          'DataSinkRepo.touchRun',
        )
      }
    }
  }
}
