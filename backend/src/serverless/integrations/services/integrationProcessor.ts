// noinspection ExceptionCaughtLocallyJS

import moment from 'moment'
import path from 'path'
import fs from 'fs'
import { createChildLogger, Logger } from '../../../utils/logging'
import IntegrationRepository from '../../../database/repositories/integrationRepository'
import MicroserviceRepository from '../../../database/repositories/microserviceRepository'
import getUserContext from '../../../database/utils/getUserContext'
import { IServiceOptions } from '../../../services/IServiceOptions'
import { singleOrDefault } from '../../../utils/arrays'
import { IntegrationType, PlatformType } from '../../../types/integrationEnums'
import { NodeWorkerIntegrationCheckMessage } from '../../../types/mq/nodeWorkerIntegrationCheckMessage'
import { NodeWorkerIntegrationProcessMessage } from '../../../types/mq/nodeWorkerIntegrationProcessMessage'
import { sendNodeWorkerMessage } from '../../utils/nodeWorkerSQS'
import { DevtoIntegrationService } from './integrations/devtoIntegrationService'
import { IntegrationServiceBase } from './integrationServiceBase'
import bulkOperations from '../../dbOperations/operationsWorker'
import { DiscordIntegrationService } from './integrations/discordIntegrationService'
import {
  IIntegrationStream,
  IProcessStreamResults,
  IStepContext,
} from '../../../types/integration/stepResult'
import { TwitterIntegrationService } from './integrations/twitterIntegrationService'
import { HackerNewsIntegrationService } from './integrations/hackerNewsIntegrationService'
import { RedditIntegrationService } from './integrations/redditIntegrationService'
import { TwitterReachIntegrationService } from './integrations/twitterReachIntegrationService'
import { SlackIntegrationService } from './integrations/slackIntegrationService'
import { GithubIntegrationService } from './integrations/githubIntegrationService'
import { StackOverlflowIntegrationService } from './integrations/stackOverflowIntegrationService'
import { LoggingBase } from '../../../services/loggingBase'
import { API_CONFIG } from '../../../config'
import EmailSender from '../../../services/emailSender'
import UserRepository from '../../../database/repositories/userRepository'
import { i18n } from '../../../i18n'
import { IRedisPubSubEmitter, RedisClient } from '../../../utils/redis'
import RedisPubSubEmitter from '../../../utils/redis/pubSubEmitter'
import { ApiWebsocketMessage } from '../../../types/mq/apiWebsocketMessage'
import SequelizeRepository from '../../../database/repositories/sequelizeRepository'
import { IRepositoryOptions } from '../../../database/repositories/IRepositoryOptions'
import IncomingWebhookRepository from '../../../database/repositories/incomingWebhookRepository'
import { WebhookError, WebhookState } from '../../../types/webhooks'
import { NodeWorkerProcessWebhookMessage } from '../../../types/mq/nodeWorkerProcessWebhookMessage'
import SampleDataService from '../../../services/sampleDataService'
import { sendSlackAlert, SlackAlertTypes } from '../../../utils/slackAlerts'
import IntegrationRunRepository from '../../../database/repositories/integrationRunRepository'
import { IntegrationRun, IntegrationRunState } from '../../../types/integrationRunTypes'
import IntegrationStreamRepository from '../../../database/repositories/integrationStreamRepository'
import {
  DbIntegrationStreamCreateData,
  IntegrationStreamState,
} from '../../../types/integrationStreamTypes'
import { twitterFollowers } from '../../../database/utils/keys/microserviceTypes'
import { processPaginated } from '../../../utils/paginationProcessing'

export class IntegrationProcessor extends LoggingBase {
  private readonly integrationServices: IntegrationServiceBase[]

  private readonly integrationRunRepository: IntegrationRunRepository

  private readonly integrationStreamRepository: IntegrationStreamRepository

  private readonly apiPubSubEmitter?: IRedisPubSubEmitter

  private tickTrackingMap: Map<IntegrationType, number> = new Map()

  constructor(options: IServiceOptions, redisEmitterClient?: RedisClient) {
    super(options)

    this.integrationServices = [
      new DevtoIntegrationService(),
      new DiscordIntegrationService(),
      new HackerNewsIntegrationService(),
      new RedditIntegrationService(),
      new TwitterIntegrationService(),
      new TwitterReachIntegrationService(),
      new SlackIntegrationService(),
      new GithubIntegrationService(),
      new StackOverlflowIntegrationService(),
    ]

    // add premium integrations
    const premiumIndexFile = path.resolve(`${__dirname}/integrations/premium/index.ts`)

    if (fs.existsSync(premiumIndexFile)) {
      const premiumIntegrations: IntegrationServiceBase[] =
        require('./integrations/premium').default

      if (premiumIntegrations.length > 0) {
        this.integrationServices.push(...premiumIntegrations)
        this.log.info(`Loaded ${premiumIntegrations.length} premium integrations!`)
      }
    }

    for (const intService of this.integrationServices) {
      this.tickTrackingMap[intService.type] = 0
    }

    this.log.debug(
      { supportedIntegrations: this.integrationServices.map((i) => i.type) },
      'Successfully detected supported integrations!',
    )

    if (redisEmitterClient) {
      this.apiPubSubEmitter = new RedisPubSubEmitter('api-pubsub', redisEmitterClient, (err) => {
        this.log.error({ err }, 'Error in api-ws emitter!')
      })
    }

    this.integrationRunRepository = new IntegrationRunRepository(options)
    this.integrationStreamRepository = new IntegrationStreamRepository(options)
  }

  async processTick() {
    await this.processCheckTick()
    await this.processDelayedTick()
  }

  private async processDelayedTick() {
    this.log.trace('Checking for delayed integration runs!')

    await processPaginated(
      async (page) => this.integrationRunRepository.findDelayedRuns(page, 10),
      async (delayedRuns) => {
        for (const run of delayedRuns) {
          this.log.info({ runId: run.id }, 'Triggering delayed integration run processing!')

          await sendNodeWorkerMessage(
            new Date().toISOString(),
            new NodeWorkerIntegrationProcessMessage(run.id),
          )
        }
      },
    )
  }

  private async processCheckTick() {
    this.log.trace('Processing integration processor tick!')

    for (const intService of this.integrationServices) {
      let trigger = false

      if (intService.ticksBetweenChecks < 0) {
        this.log.debug({ type: intService.type }, 'Integration is set to never be triggered.')
      } else if (intService.ticksBetweenChecks === 0) {
        this.log.warn({ type: intService.type }, 'Integration is set to be always triggered.')
        trigger = true
      } else {
        this.tickTrackingMap[intService.type]++

        if (this.tickTrackingMap[intService.type] === intService.ticksBetweenChecks) {
          this.log.info(
            { type: intService.type, tickCount: intService.ticksBetweenChecks },
            'Integration is being triggered since it reached its target tick count!',
          )
          trigger = true
          this.tickTrackingMap[intService.type] = 0
        }
      }

      if (trigger) {
        this.log.info({ type: intService.type }, 'Triggering integration check!')
        await sendNodeWorkerMessage(
          new Date().toISOString(),
          new NodeWorkerIntegrationCheckMessage(intService.type),
        )
      }
    }
  }

  async processCheck(type: IntegrationType) {
    const logger = createChildLogger('processCheck', this.log, { type })
    logger.trace('Processing integration check!')

    if (type === IntegrationType.TWITTER_REACH) {
      await processPaginated(
        async (page) => MicroserviceRepository.findAllByType('twitter_followers', page, 10),
        async (microservices) => {
          this.log.debug({ type, count: microservices.length }, 'Found microservices to check!')
          for (const micro of microservices) {
            const existingRun = await this.integrationRunRepository.findLastProcessingRun(
              undefined,
              micro.id,
            )
            if (!existingRun) {
              const microservice = micro as any

              const run = await this.integrationRunRepository.create({
                microserviceId: microservice.id,
                tenantId: microservice.tenantId,
                onboarding: false,
                state: IntegrationRunState.PENDING,
              })

              this.log.debug({ type, runId: run.id }, 'Triggering microservice processing!')

              await sendNodeWorkerMessage(
                microservice.tenantId,
                new NodeWorkerIntegrationProcessMessage(run.id),
              )
            }
          }
        },
      )
    } else {
      // get the relevant integration service that is supposed to be configured already
      const intService = singleOrDefault(this.integrationServices, (s) => s.type === type)
      const options =
        (await SequelizeRepository.getDefaultIRepositoryOptions()) as IRepositoryOptions

      await processPaginated(
        async (page) => IntegrationRepository.findAllActive(type, page, 10),
        async (integrations) => {
          logger.debug({ count: integrations.length }, 'Found integrations to check!')
          const inactiveIntegrations: any[] = []
          for (const integration of integrations as any[]) {
            const existingRun = await this.integrationRunRepository.findLastProcessingRun(
              integration.id,
            )
            if (!existingRun) {
              inactiveIntegrations.push(integration)
            }
          }
          await intService.triggerIntegrationCheck(inactiveIntegrations, options)
        },
      )
    }
  }

  async processWebhook(webhookId: string, force?: boolean) {
    const options = (await SequelizeRepository.getDefaultIRepositoryOptions()) as IRepositoryOptions
    const repo = new IncomingWebhookRepository(options)
    const webhook = await repo.findById(webhookId)
    let logger = createChildLogger('processWebhook', this.log, { webhookId })

    if (webhook === null || webhook === undefined) {
      logger.error('Webhook not found!')
      return
    }

    logger.debug('Processing webhook!')

    logger = createChildLogger('processWebhook', this.log, {
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
          await bulkOperations(operation.type, operation.records, userContext)
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

  async process(req: NodeWorkerIntegrationProcessMessage) {
    if (!req.runId) {
      this.log.warn("No runId provided! Skipping because it's an old message.")
      return
    }

    this.log.info({ runId: req.runId }, 'Detected integration run!')

    const run = await this.integrationRunRepository.findById(req.runId)

    const userContext = await getUserContext(run.tenantId)

    let integration

    if (run.integrationId) {
      integration = await IntegrationRepository.findById(run.integrationId, userContext)
    } else if (run.microserviceId) {
      const microservice = await MicroserviceRepository.findById(run.microserviceId, userContext)

      switch (microservice.type) {
        case twitterFollowers:
          integration = await IntegrationRepository.findByPlatform(
            PlatformType.TWITTER,
            userContext,
          )
          break
        default:
          throw new Error(`Microservice type '${microservice.type}' is not supported!`)
      }
    } else {
      this.log.error({ runId: req.runId }, 'Integration run has no integration or microservice!')
      throw new Error(`Integration run '${req.runId}' has no integration or microservice!`)
    }

    const logger = createChildLogger('process', this.log, {
      runId: req.runId,
      type: integration.platform,
      tenantId: integration.tenantId,
      integrationId: run.integrationId,
      onboarding: run.onboarding,
      microserviceId: run.microserviceId,
    })

    logger.info('Processing integration!')

    userContext.log = logger

    const existingRun = await this.integrationRunRepository.findLastProcessingRun(
      run.integrationId,
      run.microserviceId,
      req.runId,
    )

    if (existingRun) {
      logger.info('Integration is already being processed!')
      await this.integrationRunRepository.markError(req.runId, {
        message: 'Integration is already being processed!',
        existingRunId: existingRun.id,
      })
      return
    }

    if (run.state === IntegrationRunState.PROCESSED) {
      logger.warn('Integration is already processed!')
      return
    }

    if (run.state === IntegrationRunState.PENDING) {
      logger.info('Started processing integration!')
    } else if (run.state === IntegrationRunState.DELAYED) {
      logger.info('Continued processing delayed integration!')
    } else if (run.state === IntegrationRunState.ERROR) {
      logger.info('Restarted processing errored integration!')
    } else if (run.state === IntegrationRunState.PROCESSING) {
      throw new Error(`Invalid state '${run.state}' for integration run!`)
    }

    await this.integrationRunRepository.markProcessing(req.runId)
    run.state = IntegrationRunState.PROCESSING

    // get the relevant integration service that is supposed to be configured already
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
      onboarding: run.onboarding,
      pipelineData: {},
      runId: req.runId,
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

    // delete sample data on onboarding
    if (run.onboarding) {
      try {
        await new SampleDataService(userContext).deleteSampleData()
      } catch (err) {
        logger.error(err, { tenantId: integration.tenantId }, 'Error deleting sample data!')
        await this.integrationRunRepository.markError(req.runId, {
          errorPoint: 'delete_sample_data',
          message: err.message,
          stack: err.stack,
          errorString: JSON.stringify(err),
        })
        return
      }
    }

    try {
      // check global limit reset
      if (intService.limitResetFrequencySeconds > 0 && integration.limitLastResetAt) {
        const secondsSinceLastReset = moment()
          .utc()
          .diff(moment(integration.limitLastResetAt).utc(), 'seconds')

        if (secondsSinceLastReset >= intService.limitResetFrequencySeconds) {
          integration.limitCount = 0
          integration.limitLastResetAt = moment().utc().toISOString()

          await IntegrationRepository.update(
            integration.id,
            {
              limitCount: integration.limitCount,
              limitLastResetAt: integration.limitLastResetAt,
            },
            userContext,
          )
        }
      }

      // preprocess if needed
      logger.trace('Preprocessing integration!')
      try {
        await intService.preprocess(stepContext)
      } catch (err) {
        if (err.rateLimitResetSeconds) {
          // need to delay integration processing
          logger.warn(err, 'Rate limit reached while preprocessing integration! Delaying...')
          await this.handleRateLimitError(logger, run, err.rateLimitResetSeconds, stepContext)
          return
        }

        throw err
      }

      // detect streams to process for this integration
      const dbStreams = await this.integrationStreamRepository.findByRunId(req.runId, 1, 1)
      if (dbStreams.length > 0) {
        logger.trace('Streams already detected and saved to the database!')
      } else {
        // need to optimize this as well since it may happen that we have a lot of streams
        logger.trace('Detecting streams!')
        try {
          const pendingStreams = await intService.getStreams(stepContext)
          const createStreams: DbIntegrationStreamCreateData[] = pendingStreams.map((s) => ({
            runId: req.runId,
            tenantId: run.tenantId,
            integrationId: run.integrationId,
            microserviceId: run.microserviceId,
            name: s.value,
            metadata: s.metadata,
          }))
          await this.integrationStreamRepository.bulkCreate(createStreams)
          await this.integrationRunRepository.touch(run.id)
        } catch (err) {
          if (err.rateLimitResetSeconds) {
            // need to delay integration processing
            logger.warn(err, 'Rate limit reached while getting integration streams! Delaying...')
            await this.handleRateLimitError(logger, run, err.rateLimitResetSeconds, stepContext)
            return
          }

          throw err
        }
      }

      // process streams
      let processedCount = 0
      let notifyCount = 0

      let nextStream = await this.integrationStreamRepository.getNextStreamToProcess(req.runId)
      while (nextStream) {
        if ((req as any).exiting) {
          if (!run.onboarding) {
            logger.warn('Stopped processing integration (not onboarding)!')
            break
          } else {
            logger.warn('Stopped processing integration (onboarding)!')
            const delayUntil = moment()
              .add(3 * 60, 'seconds')
              .toDate()
            await this.integrationRunRepository.delay(req.runId, delayUntil)
            break
          }
        }

        const stream: IIntegrationStream = {
          id: nextStream.id,
          value: nextStream.name,
          metadata: nextStream.metadata,
        }

        processedCount++
        notifyCount++

        let processStreamResult: IProcessStreamResults

        logger.trace({ streamId: stream.id }, 'Processing stream!')
        await this.integrationStreamRepository.markProcessing(stream.id)
        await this.integrationRunRepository.touch(run.id)
        try {
          processStreamResult = await intService.processStream(stream, stepContext)
        } catch (err) {
          if (err.rateLimitResetSeconds) {
            logger.warn(
              { streamId: stream.id, message: err.message },
              'Rate limit reached while processing stream! Delaying...',
            )
            await this.handleRateLimitError(
              logger,
              run,
              err.rateLimitResetSeconds,
              stepContext,
              stream,
            )
            return
          }

          const retries = await this.integrationStreamRepository.markError(stream.id, {
            errorPoint: 'process_stream',
            message: err.message,
            stack: err.stack,
            errorString: JSON.stringify(err),
          })
          await this.integrationRunRepository.touch(run.id)

          logger.error(err, { retries, streamId: stream.id }, 'Error while processing stream!')
        }

        if (processStreamResult) {
          // surround with try catch so if one stream fails we try all of them as well just in case
          try {
            logger.trace({ stream: JSON.stringify(stream) }, `Processing stream results!`)

            if (processStreamResult.newStreams && processStreamResult.newStreams.length > 0) {
              const dbCreateStreams: DbIntegrationStreamCreateData[] =
                processStreamResult.newStreams.map((s) => ({
                  runId: req.runId,
                  tenantId: run.tenantId,
                  integrationId: run.integrationId,
                  microserviceId: run.microserviceId,
                  name: s.value,
                  metadata: s.metadata,
                }))

              await this.integrationStreamRepository.bulkCreate(dbCreateStreams)
              await this.integrationRunRepository.touch(run.id)

              logger.info(
                `Detected ${processStreamResult.newStreams.length} new streams to process!`,
              )
            }

            for (const operation of processStreamResult.operations) {
              if (operation.records.length > 0) {
                logger.trace(
                  { operationType: operation.type },
                  `Processing bulk operation with ${operation.records.length} records!`,
                )
                stepContext.limitCount += operation.records.length
                await bulkOperations(operation.type, operation.records, userContext)
              }
            }

            if (processStreamResult.nextPageStream !== undefined) {
              if (
                !run.onboarding &&
                (await intService.isProcessingFinished(
                  stepContext,
                  stream,
                  processStreamResult.operations,
                  processStreamResult.lastRecordTimestamp,
                ))
              ) {
                logger.warn('Integration processing finished because of service implementation!')
              } else {
                logger.trace(
                  { currentStream: JSON.stringify(stream) },
                  `Detected next page stream!`,
                )
                await this.integrationStreamRepository.create({
                  runId: req.runId,
                  tenantId: run.tenantId,
                  integrationId: run.integrationId,
                  microserviceId: run.microserviceId,
                  name: processStreamResult.nextPageStream.value,
                  metadata: processStreamResult.nextPageStream.metadata,
                })
                await this.integrationRunRepository.touch(run.id)
              }
            }

            if (processStreamResult.sleep !== undefined && processStreamResult.sleep > 0) {
              logger.warn(
                `Stream processing resulted in a requested delay of ${processStreamResult.sleep}! Will delay remaining streams!`,
              )

              const delayUntil = moment().add(processStreamResult.sleep, 'seconds').toDate()
              await this.integrationRunRepository.delay(req.runId, delayUntil)
              break
            }

            if (intService.globalLimit > 0 && stepContext.limitCount >= intService.globalLimit) {
              // if limit reset frequency is 0 we don't need to care about limits
              if (intService.limitResetFrequencySeconds > 0) {
                logger.warn(
                  {
                    limitCount: stepContext.limitCount,
                    globalLimit: intService.globalLimit,
                  },
                  'We reached a global limit - stopping processing!',
                )

                integration.limitCount = stepContext.limitCount

                const secondsSinceLastReset = moment()
                  .utc()
                  .diff(moment(integration.limitLastResetAt).utc(), 'seconds')

                if (secondsSinceLastReset < intService.limitResetFrequencySeconds) {
                  const delayUntil = moment()
                    .add(intService.limitResetFrequencySeconds - secondsSinceLastReset, 'seconds')
                    .toDate()
                  await this.integrationRunRepository.delay(req.runId, delayUntil)
                }

                break
              }
            }

            if (notifyCount === 50) {
              logger.info(`Processed ${processedCount} streams!`)
              notifyCount = 0
            }

            await this.integrationStreamRepository.markProcessed(stream.id)
            await this.integrationRunRepository.touch(run.id)

            nextStream = await this.integrationStreamRepository.getNextStreamToProcess(req.runId)
          } catch (err) {
            logger.error(
              err,
              { stream: JSON.stringify(stream) },
              'Error processing stream results!',
            )
            await this.integrationStreamRepository.markError(stream.id, {
              errorPoint: 'process_stream_results',
              message: err.message,
              stack: err.stack,
              errorString: JSON.stringify(err),
            })
            await this.integrationRunRepository.touch(run.id)
          }
        }
      }

      // postprocess integration settings
      await intService.postprocess(stepContext)

      logger.info('Done processing integration!')
    } catch (err) {
      logger.error(err, 'Error while processing integration!')
    } finally {
      const newState = await this.integrationRunRepository.touchState(req.runId)

      let emailSentAt
      if (newState === IntegrationRunState.PROCESSED) {
        if (!integration.emailSentAt) {
          const tenantUsers = await UserRepository.findAllUsersOfTenant(integration.tenantId)
          emailSentAt = new Date()
          for (const user of tenantUsers) {
            await new EmailSender(EmailSender.TEMPLATES.INTEGRATION_DONE, {
              integrationName: i18n('en', `entities.integration.name.${integration.platform}`),
              link: API_CONFIG.frontendUrl,
            }).sendTo(user.email)
          }
        }
      }

      let status
      switch (newState) {
        case IntegrationRunState.PROCESSED:
          status = 'done'
          break
        case IntegrationRunState.ERROR:
          status = 'error'
          break
        default:
          status = integration.status
      }

      await IntegrationRepository.update(
        integration.id,
        {
          status,
          emailSentAt,
          settings: stepContext.integration.settings,
          refreshToken: stepContext.integration.refreshToken,
          token: stepContext.integration.token,
        },
        userContext,
      )

      if (newState === IntegrationRunState.PROCESSING) {
        const failedStreams = await this.integrationStreamRepository.findByRunId(req.runId, 1, 1, [
          IntegrationStreamState.ERROR,
        ])
        if (failedStreams.length > 0) {
          logger.warn('Integration ended but we are still processing - delaying for a minute!')
          const delayUntil = moment().add(60, 'seconds')
          await this.integrationRunRepository.delay(run.id, delayUntil.toDate())
        } else {
          logger.error('Integration ended but we are still processing!')
        }
      } else if (newState === IntegrationRunState.ERROR) {
        await sendSlackAlert(SlackAlertTypes.INTEGRATION_ERROR, integration, userContext, logger)
      }

      if (run.onboarding && this.apiPubSubEmitter) {
        this.apiPubSubEmitter.emit(
          'user',
          new ApiWebsocketMessage(
            'integration-completed',
            JSON.stringify({
              integrationId: integration.id,
              status,
            }),
            undefined,
            integration.tenantId,
          ),
        )
      }
    }
  }

  private async handleRateLimitError(
    logger: Logger,
    run: IntegrationRun,
    rateLimitResetSeconds: number,
    context: IStepContext,
    stream?: IIntegrationStream,
  ): Promise<void> {
    await IntegrationRepository.update(
      context.integration.id,
      {
        settings: context.integration.settings,
        refreshToken: context.integration.refreshToken,
        token: context.integration.token,
      },
      context.repoContext,
    )

    logger.warn('Rate limit reached, delaying integration processing!')
    const delayUntil = moment().add(rateLimitResetSeconds + 30, 'seconds')
    await this.integrationRunRepository.delay(run.id, delayUntil.toDate())

    if (stream) {
      await this.integrationStreamRepository.reset(stream.id)
    }
  }
}
