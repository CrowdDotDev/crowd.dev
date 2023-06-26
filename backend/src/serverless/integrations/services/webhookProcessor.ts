import { LoggerBase, getChildLogger } from '@crowd/logging'
import moment from 'moment'
import { singleOrDefault } from '@crowd/common'
import { IRepositoryOptions } from '../../../database/repositories/IRepositoryOptions'
import IncomingWebhookRepository from '../../../database/repositories/incomingWebhookRepository'
import IntegrationRepository from '../../../database/repositories/integrationRepository'
import SequelizeRepository from '../../../database/repositories/sequelizeRepository'
import getUserContext from '../../../database/utils/getUserContext'
import { IServiceOptions } from '../../../services/IServiceOptions'
import { IStepContext } from '../../../types/integration/stepResult'
import { NodeWorkerProcessWebhookMessage } from '../../../types/mq/nodeWorkerProcessWebhookMessage'
import { WebhookError, WebhookState } from '../../../types/webhooks'
import bulkOperations from '../../dbOperations/operationsWorker'
import { sendNodeWorkerMessage } from '../../utils/nodeWorkerSQS'
import { IntegrationServiceBase } from './integrationServiceBase'
import SegmentRepository from '../../../database/repositories/segmentRepository'

export class WebhookProcessor extends LoggerBase {
  constructor(
    options: IServiceOptions,
    private readonly integrationServices: IntegrationServiceBase[],
  ) {
    super(options.log)
  }

  static readonly MAX_RETRY_LIMIT = 5

  async processWebhook(webhookId: string, force?: boolean, fireCrowdWebhooks?: boolean) {
    const options = (await SequelizeRepository.getDefaultIRepositoryOptions()) as IRepositoryOptions
    const repo = new IncomingWebhookRepository(options)
    const webhook = await repo.findById(webhookId)
    let logger = getChildLogger('processWebhook', this.log, { webhookId })

    if (webhook === null || webhook === undefined) {
      logger.error('Webhook not found!')
      return
    }

    logger.debug('Processing webhook!')

    logger = getChildLogger('processWebhook', this.log, {
      type: webhook.type,
      tenantId: webhook.tenantId,
      integrationId: webhook.integrationId,
    })

    logger.info('Webhook found!')

    if (!(force === true) && webhook.state !== WebhookState.PENDING) {
      logger.error({ state: webhook.state }, 'Webhook is not in pending state!')
      return
    }

    const userContext = await getUserContext(webhook.tenantId)
    userContext.log = logger

    const integration = await IntegrationRepository.findById(webhook.integrationId, userContext)
    const segment = await new SegmentRepository(userContext).findById(integration.segmentId)
    userContext.currentSegments = [segment]

    const intService = singleOrDefault(
      this.integrationServices,
      (s) => s.type === integration.platform,
    )
    if (intService === undefined) {
      logger.error('No integration service configured!')
      throw new Error(`No integration service configured for type '${integration.platform}'!`)
    }

    const stepContext: IStepContext = {
      startTimestamp: moment().utc().unix(),
      limitCount: integration.limitCount || 0,
      onboarding: false,
      pipelineData: {},
      webhook,
      integration,
      serviceContext: userContext,
      repoContext: userContext,
      logger,
    }

    if (integration.settings.updateMemberAttributes) {
      logger.trace('Updating member attributes!')

      await intService.createMemberAttributes(stepContext)

      integration.settings.updateMemberAttributes = false
      await IntegrationRepository.update(
        integration.id,
        { settings: integration.settings },
        userContext,
      )
    }

    const whContext = { ...userContext }
    whContext.transaction = await SequelizeRepository.createTransaction(whContext)

    try {
      const result = await intService.processWebhook(webhook, stepContext)
      for (const operation of result.operations) {
        if (operation.records.length > 0) {
          logger.trace(
            { operationType: operation.type },
            `Processing bulk operation with ${operation.records.length} records!`,
          )
          await bulkOperations(operation.type, operation.records, userContext, fireCrowdWebhooks)
        }
      }
      await repo.markCompleted(webhook.id)
      logger.debug('Webhook processed!')
    } catch (err) {
      if (err.rateLimitResetSeconds) {
        logger.warn(err, 'Rate limit reached while processing webhook! Delaying...')
        await sendNodeWorkerMessage(
          integration.tenantId,
          new NodeWorkerProcessWebhookMessage(integration.tenantId, webhookId),
          err.rateLimitResetSeconds + 5,
        )
      } else {
        logger.error(err, 'Error processing webhook!')
        await repo.markError(
          webhook.id,
          new WebhookError(webhook.id, 'Error processing webhook!', err),
        )
      }
    } finally {
      await SequelizeRepository.commitTransaction(whContext.transaction)
    }
  }
}
