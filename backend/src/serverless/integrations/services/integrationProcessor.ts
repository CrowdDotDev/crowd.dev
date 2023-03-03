// noinspection ExceptionCaughtLocallyJS

import moment from 'moment'
import { v4 as uuid } from 'uuid'
import path from 'path'
import fs from 'fs'
import { createChildLogger } from '../../../utils/logging'
import IntegrationRepository from '../../../database/repositories/integrationRepository'
import MicroserviceRepository from '../../../database/repositories/microserviceRepository'
import getUserContext from '../../../database/utils/getUserContext'
import { IServiceOptions } from '../../../services/IServiceOptions'
import { singleOrDefault } from '../../../utils/arrays'
import { IntegrationType, PlatformType } from '../../../types/integrationEnums'
import { NodeWorkerIntegrationCheckMessage } from '../../../types/mq/nodeWorkerIntegrationCheckMessage'
import {
  IIntegrationStreamRetry,
  NodeWorkerIntegrationProcessMessage,
} from '../../../types/mq/nodeWorkerIntegrationProcessMessage'
import { sendNodeWorkerMessage } from '../../utils/nodeWorkerSQS'
import { DevtoIntegrationService } from './integrations/devtoIntegrationService'
import { IntegrationServiceBase } from './integrationServiceBase'
import bulkOperations from '../../dbOperations/operationsWorker'
import { DiscordIntegrationService } from './integrations/discordIntegrationService'
import { IIntegrationStream, IStepContext } from '../../../types/integration/stepResult'
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
import { RedisCache } from '../../../utils/redis/redisCache'
import SequelizeRepository from '../../../database/repositories/sequelizeRepository'
import { IRepositoryOptions } from '../../../database/repositories/IRepositoryOptions'
import IncomingWebhookRepository from '../../../database/repositories/incomingWebhookRepository'
import { WebhookError, WebhookState } from '../../../types/webhooks'
import { NodeWorkerProcessWebhookMessage } from '../../../types/mq/nodeWorkerProcessWebhookMessage'

const MAX_STREAM_RETRIES = 5

export class IntegrationProcessor extends LoggingBase {
  private readonly integrationServices: IntegrationServiceBase[]

  private readonly apiPubSubEmitter?: IRedisPubSubEmitter

  private readonly redisCache?: RedisCache

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

      this.redisCache = new RedisCache('integrationProcessor', redisEmitterClient)
    }
  }

  async processTick() {
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
          const isProcessing = await this.redisCache.getValue(micro.id)
          if (isProcessing === null) {
            const microservice = micro as any
            await sendNodeWorkerMessage(
              microservice.tenantId,
              new NodeWorkerIntegrationProcessMessage(
                type,
                microservice.tenantId,
                false,
                undefined,
                microservice.id,
                {
                  platform: PlatformType.TWITTER,
                },
              ),
            )
          }
        }
      } else {
        logger.debug('Found no microservices to check!')
      }
    } else {
      // get the relevant integration service that is supposed to be configured already
      const intService = singleOrDefault(this.integrationServices, (s) => s.type === type)

      const integrations = await IntegrationRepository.findAllActive(type)
      if (integrations.length > 0) {
        logger.debug({ count: integrations.length }, 'Found integrations to check!')
        const inactiveIntegrations: any[] = []
        for (const integration of integrations as any[]) {
          const isProcessing = await this.redisCache.getValue(integration.id)
          if (isProcessing === null) {
            inactiveIntegrations.push(integration)
          }
        }
        await intService.triggerIntegrationCheck(inactiveIntegrations)
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
    const logger = createChildLogger('process', this.log, {
      type: req.integrationType,
      tenantId: req.tenantId,
      integrationId: req.integrationId,
      onboarding: req.onboarding,
      microserviceId: req.microserviceId,
    })
    logger.info('Processing integration!')

    const userContext = await getUserContext(req.tenantId)
    userContext.log = logger

    // load integration from database
    const integration = req.integrationId
      ? await IntegrationRepository.findById(req.integrationId, userContext)
      : await IntegrationRepository.findByPlatform(req.metadata.platform, userContext)

    if (!req.onboarding) {
      const processing = await this.redisCache.getValue(integration.id)
      if (processing !== null) {
        logger.info('Integration is already being processed!')
        return
      }
    }

    await this.redisCache.setValue(integration.id, 'processing', 5 * 60)

    // get the relevant integration service that is supposed to be configured already
    const intService = singleOrDefault(
      this.integrationServices,
      (s) => s.type === req.integrationType,
    )
    if (intService === undefined) {
      logger.error('No integration service configured!')
      throw new Error(`No integration service configured for type '${req.integrationType}'!`)
    }

    const stepContext: IStepContext = {
      startTimestamp: moment().utc().unix(),
      limitCount: integration.limitCount || 0,
      onboarding: req.onboarding,
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

    const failedStreams = []
    let setError = false

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
          await sendNodeWorkerMessage(req.tenantId, req, err.rateLimitResetSeconds + 5)
          return
        }

        throw err
      }

      // detect streams to process for this integration
      let streams: IIntegrationStream[]
      if (
        (req.retryStreams && req.retryStreams.length > 0) ||
        (req.remainingStreams && req.remainingStreams.length > 0)
      ) {
        const retryStreams = req.retryStreams || []
        streams = req.remainingStreams || []

        logger.info(
          { retryStreamCount: retryStreams.length, delayedStreamCount: streams.length },
          'Detected retried/delayed streams in request - skipping integration service getStreams method call!',
        )

        for (const retryStream of retryStreams) {
          const stream = retryStream.stream
          stream.id = retryStream.id
          streams.push(stream)
        }
      } else {
        logger.trace('Detecting streams!')
        try {
          streams = await intService.getStreams(stepContext)
        } catch (err) {
          if (err.rateLimitResetSeconds) {
            // need to delay integration processing
            logger.warn(err, 'Rate limit reached while getting integration streams! Delaying...')
            await sendNodeWorkerMessage(req.tenantId, req, err.rateLimitResetSeconds + 5)
            return
          }

          throw err
        }
      }

      // delay for retries/continuing with the remaining streams (in seconds)
      let delay: number = 5

      let exit = false

      if (streams.length > 0) {
        logger.info({ streamCount: streams.length }, 'Detected streams to process!')

        // process streams
        let processedCount = 0
        let notifyCount = 0
        while (streams.length > 0) {
          // reset value
          await this.redisCache.setValue(integration.id, 'processing', 5 * 60)

          if ((req as any).exiting) {
            if (!req.onboarding) {
              logger.warn('Stopped processing integration (not onboarding)!')
              exit = true
              break
            } else {
              logger.warn('Stopped processing integration (onboarding)!')
              delay = 3 * 60
              break
            }
          }

          const stream = streams.pop()

          processedCount++
          notifyCount++

          // surround with try catch so if one stream fails we try all of them as well just in case
          try {
            logger.trace(
              { stream: JSON.stringify(stream) },
              `Processing stream! Still have ${streams.length} streams left to process!`,
            )
            let processStreamResult
            try {
              processStreamResult = await intService.processStream(stream, stepContext)
            } catch (err) {
              if (err.rateLimitResetSeconds) {
                delay = err.rateLimitResetSeconds + 5
                logger.warn(
                  { stream: JSON.stringify(stream), delay, message: err.message },
                  'Rate limit reached while processing stream! Delaying...',
                )
                failedStreams.push(stream)
                break
              } else {
                throw err
              }
            }

            if (processStreamResult.newStreams && processStreamResult.newStreams.length > 0) {
              streams.push(...processStreamResult.newStreams)

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
                !req.onboarding &&
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
                streams.push(processStreamResult.nextPageStream)
              }
            }

            if (processStreamResult.sleep !== undefined && processStreamResult.sleep > 0) {
              logger.warn(
                `Stream processing resulted in a requested delay of ${processStreamResult.sleep}! Will delay ${streams.length} streams!`,
              )

              delay = processStreamResult.sleep
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
                  delay = intService.limitResetFrequencySeconds - secondsSinceLastReset
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
          } catch (err) {
            logger.error(err, { stream: JSON.stringify(stream) }, 'Error processing a stream!')
            failedStreams.push(stream)
          }
        }

        // postprocess integration settings
        await intService.postprocess(stepContext, failedStreams, streams)

        if (!exit && (streams.length > 0 || failedStreams.length > 0)) {
          logger.warn(
            { failed: failedStreams.length, remaining: streams.length },
            'Integration processing finished - some streams were not processed!',
          )

          const existingRetryStreams = req.retryStreams || []

          const retryStreams: IIntegrationStreamRetry[] = []
          let streamRetryLimitReached = false
          for (const failedStream of failedStreams) {
            let retryCount = 1
            let id = uuid()
            if (failedStream.id) {
              for (const existingRetryStream of existingRetryStreams) {
                if (failedStream.id === existingRetryStream.id) {
                  retryCount = existingRetryStream.retryCount + 1
                  id = existingRetryStream.id
                  break
                }
              }
            }

            if (retryCount > MAX_STREAM_RETRIES) {
              logger.warn(
                { failedStream: JSON.stringify(failedStream) },
                'Failed stream will not be retried because it reached retry limit!',
              )
              streamRetryLimitReached = true
            } else {
              retryStreams.push({
                id,
                retryCount,
                stream: failedStream,
              })

              if (delay < retryCount * 5) {
                delay = retryCount * 5
              }
            }
          }

          if (streams.length > 0 || retryStreams.length > 0) {
            await sendNodeWorkerMessage(
              req.tenantId,
              new NodeWorkerIntegrationProcessMessage(
                req.integrationType,
                req.tenantId,
                req.onboarding,
                req.integrationId,
                req.microserviceId,
                req.metadata,
                retryStreams,
                streams,
              ),
              delay,
            )
          } else if (streamRetryLimitReached && req.onboarding) {
            setError = true
          }
        }
        logger.info('Done processing integration!')
      } else {
        logger.warn('No streams detected!')
      }
    } catch (err) {
      logger.error(err, 'Error while processing integration!')
      setError = req.onboarding
    } finally {
      let emailSentAt
      if (!setError && !integration.emailSentAt) {
        const tenantUsers = await UserRepository.findAllUsersOfTenant(integration.tenantId)
        emailSentAt = new Date()
        for (const user of tenantUsers) {
          await new EmailSender(EmailSender.TEMPLATES.INTEGRATION_DONE, {
            integrationName: i18n('en', `entities.integration.name.${integration.platform}`),
            link: API_CONFIG.frontendUrl,
          }).sendTo(user.email)
        }
      }

      await this.redisCache.delete(integration.id)

      await IntegrationRepository.update(
        integration.id,
        {
          status: setError ? 'error' : 'done',
          emailSentAt,
          settings: stepContext.integration.settings,
          refreshToken: stepContext.integration.refreshToken,
          token: stepContext.integration.token,
        },
        userContext,
      )

      if (req.onboarding && this.apiPubSubEmitter) {
        this.apiPubSubEmitter.emit(
          'user',
          new ApiWebsocketMessage(
            'integration-completed',
            JSON.stringify({ integrationId: integration.id, status: setError ? 'error' : 'done' }),
            undefined,
            integration.tenantId,
          ),
        )
      }
    }
  }
}
