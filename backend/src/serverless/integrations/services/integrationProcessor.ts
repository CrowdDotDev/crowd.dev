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
  IFailedIntegrationStream,
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
import {DiscourseIntegrationService} from './integrations/discourseIntegrationService'
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
      new DiscourseIntegrationService(),
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

    const delayedRuns = await this.integrationRunRepository.findDelayedRuns()

    for (const run of delayedRuns) {
      this.log.info({ runId: run.id }, 'Triggering delayed integration run processing!')

      await sendNodeWorkerMessage(
        new Date().toISOString(),
        new NodeWorkerIntegrationProcessMessage(run.id),
      )
    }
  }

  private async processCheckTick() {
    this.log.trace('Processing integration processor tick!')

    for (const intService of this.integrationServices) {
      let trigger = false

      if (intService.ticksBetweenChecks < 0) {
        this.log.info({ type: intService.type }, 'Integration is set to never be triggered.')
      } else if (intService.ticksBetweenChecks === 0) {
        this.log.info({ type: intService.type }, 'Integration is set to be always triggered.')
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
      const microservices = await MicroserviceRepository.findAllByType('twitter_followers')
      if (microservices.length > 0) {
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
              new NodeWorkerIntegrationProcessMessage(run.id, {
                platform: PlatformType.TWITTER,
              }),
            )
          }
        }
      } else {
        logger.debug('Found no microservices to check!')
      }
    } else {
      // get the relevant integration service that is supposed to be configured already
      const intService = singleOrDefault(this.integrationServices, (s) => s.type === type)
      const options =
        (await SequelizeRepository.getDefaultIRepositoryOptions()) as IRepositoryOptions

      const integrations = await IntegrationRepository.findAllActive(type)
      if (integrations.length > 0) {
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
      } else {
        logger.debug('Found no integrations to check!')
      }
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
          await bulkOperations(integration.tenantId, operation.type, operation.records)
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

    // load integration from database
    const integration = run.integrationId
      ? await IntegrationRepository.findById(run.integrationId, userContext)
      : await IntegrationRepository.findByPlatform(req.metadata.platform, userContext)

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

    // keep track of failed streams
    const failedStreams: IFailedIntegrationStream[] = []

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
      let streams: IIntegrationStream[]

      const dbStreams = await this.integrationStreamRepository.findByRunId(req.runId)
      if (dbStreams.length > 0) {
        streams = dbStreams
          .filter(
            (s) =>
              s.state === IntegrationStreamState.PENDING ||
              (s.state === IntegrationStreamState.ERROR && s.retries <= 5),
          )
          .map((s) => ({
            id: s.id,
            value: s.name,
            metadata: s.metadata,
          }))
      } else {
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
          const results = await this.integrationStreamRepository.bulkCreate(createStreams)
          await this.integrationRunRepository.touch(run.id)
          streams = results.map((r) => ({
            id: r.id,
            value: r.name,
            metadata: r.metadata,
          }))
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

      if (streams.length > 0) {
        logger.info({ streamCount: streams.length }, 'Detected streams to process!')

        // process streams
        let processedCount = 0
        let notifyCount = 0
        while (streams.length > 0) {
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

          const stream = streams.pop()

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
              streams.push(stream)
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

            failedStreams.push({
              ...stream,
              retries,
            })
          }

          if (processStreamResult) {
            // surround with try catch so if one stream fails we try all of them as well just in case
            try {
              logger.trace(
                { stream: JSON.stringify(stream) },
                `Processing stream results! Still have ${streams.length} streams left to process!`,
              )

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

                const results = await this.integrationStreamRepository.bulkCreate(dbCreateStreams)
                await this.integrationRunRepository.touch(run.id)

                const newStreams: IIntegrationStream[] = results.map((r) => ({
                  id: r.id,
                  value: r.name,
                  metadata: r.metadata,
                }))

                streams.push(...newStreams)

                logger.info(
                  `Detected ${processStreamResult.newStreams.length} new streams to process! Now we have ${streams.length} streams to process.`,
                )
              }

              for (const operation of processStreamResult.operations) {
                if (operation.records.length > 0) {
                  logger.trace(
                    { operationType: operation.type },
                    `Processing bulk operation with ${operation.records.length} records!`,
                  )
                  stepContext.limitCount += operation.records.length
                  await bulkOperations(integration.tenantId, operation.type, operation.records)
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
                    `Detected next page stream! Now we have ${streams.length} left to process!`,
                  )
                  const result = await this.integrationStreamRepository.create({
                    runId: req.runId,
                    tenantId: run.tenantId,
                    integrationId: run.integrationId,
                    microserviceId: run.microserviceId,
                    name: processStreamResult.nextPageStream.value,
                    metadata: processStreamResult.nextPageStream.metadata,
                  })
                  await this.integrationRunRepository.touch(run.id)

                  streams.push({
                    id: result.id,
                    value: result.name,
                    metadata: result.metadata,
                  })
                }
              }

              if (processStreamResult.sleep !== undefined && processStreamResult.sleep > 0) {
                logger.warn(
                  `Stream processing resulted in a requested delay of ${processStreamResult.sleep}! Will delay ${streams.length} streams!`,
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
                      streamsLeft: streams.length,
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

              if (notifyCount === 50 || streams.length === 0) {
                logger.info(
                  `Processed ${processedCount} streams! Still have ${streams.length} to process.`,
                )
                notifyCount = 0
              }

              await this.integrationStreamRepository.markProcessed(stream.id)
              await this.integrationRunRepository.touch(run.id)
            } catch (err) {
              logger.error(
                err,
                { stream: JSON.stringify(stream) },
                'Error processing stream results!',
              )
              const retries = await this.integrationStreamRepository.markError(stream.id, {
                errorPoint: 'process_stream_results',
                message: err.message,
                stack: err.stack,
                errorString: JSON.stringify(err),
              })
              await this.integrationRunRepository.touch(run.id)

              failedStreams.push({
                ...stream,
                retries,
              })
            }
          }
        }

        // postprocess integration settings
        await intService.postprocess(stepContext, failedStreams, streams)

        logger.info('Done processing integration!')
      } else {
        logger.warn('No streams detected!')
      }
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
