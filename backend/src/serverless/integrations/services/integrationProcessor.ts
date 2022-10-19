import moment from 'moment'
import IntegrationRepository from '../../../database/repositories/integrationRepository'
import MicroserviceRepository from '../../../database/repositories/microserviceRepository'
import getUserContext from '../../../database/utils/getUserContext'
import { IServiceOptions } from '../../../services/IServiceOptions'
import { singleOrDefault } from '../../../utils/arrays'
import { IntegrationType, PlatformType } from '../../../types/integrationEnums'
import { createChildLogger, Logger } from '../../../utils/logging'
import { NodeWorkerIntegrationCheckMessage } from '../../../types/mq/nodeWorkerIntegrationCheckMessage'
import { NodeWorkerIntegrationProcessMessage } from '../../../types/mq/nodeWorkerIntegrationProcessMessage'
import { sendNodeWorkerMessage } from '../../utils/nodeWorkerSQS'
import { DevtoIntegrationService } from './integrations/devtoIntegrationService'
import { IntegrationServiceBase } from './integrationServiceBase'
import bulkOperations from '../../dbOperations/operationsWorker'
import { DiscordIntegrationService } from './integrations/discordIntegrationService'
import { IStepContext } from '../../../types/integration/stepResult'
import { TwitterIntegrationService } from './integrations/twitterIntegrationService'
import { TwitterReachIntegrationService } from './integrations/twitterReachIntegrationService'

export class IntegrationProcessor {
  private readonly log: Logger

  private readonly integrationServices: IntegrationServiceBase[]

  private tickTrackingMap: Map<IntegrationType, number> = new Map()

  constructor(options: IServiceOptions) {
    this.log = createChildLogger(this.constructor.name, options.log, {})

    this.integrationServices = [
      new DevtoIntegrationService(),
      new DiscordIntegrationService(),
      new TwitterIntegrationService(),
      new TwitterReachIntegrationService(),
    ]

    for (const intService of this.integrationServices) {
      this.tickTrackingMap[intService.type] = 0
    }

    this.log.info(
      { supportedIntegrations: this.integrationServices.map((i) => i.type) },
      'Successfully detected supported integrations!',
    )
  }

  async processTick() {
    this.log.info('Processing integration processor tick!')

    for (const intService of this.integrationServices) {
      let trigger = false

      if (intService.ticksBetweenChecks === 0) {
        this.log.info({ type: intService.type }, 'Integration is set to be always triggered.')
        trigger = true
      }

      this.tickTrackingMap[intService.type]++

      if (this.tickTrackingMap[intService.type] === intService.ticksBetweenChecks) {
        this.log.info(
          { type: intService.type, tickCount: intService.ticksBetweenChecks },
          'Integration is being triggered since it reached its target tick count!',
        )
        trigger = true
        this.tickTrackingMap[intService.type] = 0
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
    logger.info('Processing integration check!')

    if (type === IntegrationType.TWITTER_REACH) {
      const microservices = await MicroserviceRepository.findAllByType('twitter_followers')
      if (microservices.length > 0) {
        this.log.info({ type, count: microservices.length }, 'Found microservices to check!')
        for (const micro of microservices) {
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
      } else {
        logger.info('Found no microservices to check!')
      }
    } else {
      const integrations = await IntegrationRepository.findAllActive(type)
      if (integrations.length > 0) {
        logger.info({ count: integrations.length }, 'Found integrations to check!')
        for (const int of integrations) {
          const integration = int as any
          await sendNodeWorkerMessage(
            integration.tenantId,
            new NodeWorkerIntegrationProcessMessage(
              type,
              integration.tenantId,
              false,
              integration.id,
            ),
          )
        }
      } else {
        logger.info('Found no integrations to check!')
      }
    }
  }

  async process(req: NodeWorkerIntegrationProcessMessage) {
    const logger = createChildLogger('process', this.log, {
      type: req.integrationType,
      integrationId: req.integrationId,
      microserviceId: req.microserviceId,
    })
    logger.info({ req }, 'Processing integration!')

    const userContext = await getUserContext(req.tenantId)
    userContext.log = logger

    // load integration from database
    const integration = req.integrationId
      ? await IntegrationRepository.findById(req.integrationId, userContext)
      : await IntegrationRepository.findByPlatform(req.metadata.platform, userContext)

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
      integration,
      serviceContext: userContext,
      repoContext: userContext,
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

    let processMetadata: any | undefined

    const failedStreams = []

    try {
      // check global limit reset
      if (intService.limitResetFrequencySeconds > 0 && integration.limitLastResetAt) {
        const secondsSinceLastReset = moment()
          .utc()
          .diff(moment(integration.limitLastResetAt).utc(), 'seconds')

        if (secondsSinceLastReset >= intService.limitResetFrequencySeconds) {
          integration.limitCount = 0
          integration.limitLastResetAt = moment().utc().toISOString()
        }
      }

      // mark integration as in process
      await IntegrationRepository.update(
        integration.id,
        {
          status: 'in-progress',
          limitCount: integration.limitCount,
          limitLastResetAt: integration.limitLastResetAt,
        },
        userContext,
      )

      // preprocess if needed
      const preprocessResult = await intService.preprocess(stepContext)
      processMetadata = preprocessResult.processMetadata || processMetadata

      // detect streams to process for this integration
      const getStreamsResult = await intService.getStreams(stepContext, processMetadata)
      const streams = getStreamsResult.streams
      processMetadata = getStreamsResult.processMetadata || processMetadata

      if (streams.length > 0) {
        logger.info({ streamCount: streams.length }, 'Detected streams to process!')

        // process streams
        while (streams.length > 0) {
          const stream = streams.pop()

          // surround with try catch so if one stream fails we try all of them as well just in case
          try {
            logger.info({ stream, remainingStreams: streams.length }, `Processing stream.`)
            const processStreamResult = await intService.processStream(
              stream,
              stepContext,
              processMetadata,
            )
            processMetadata = processStreamResult.processMetadata || processMetadata

            if (processStreamResult.newStreams && processStreamResult.newStreams.length > 0) {
              streams.push(...processStreamResult.newStreams)
            }

            for (const operation of processStreamResult.operations) {
              if (operation.records.length > 0) {
                logger.info(
                  { operationType: operation.type, recordCount: operation.records.length },
                  'Processing bulk operation from stream result!',
                )
                stepContext.limitCount += operation.records.length
                await bulkOperations(integration.tenantId, operation.type, operation.records)
              }
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
                break
              }
            }

            if (
              !req.onboarding &&
              (await intService.isProcessingFinished(
                stepContext,
                stream,
                processStreamResult.operations,
                processStreamResult.lastRecordTimestamp,
                processMetadata,
              ))
            ) {
              logger.warn('Integration processing finished because of service implementation!')
              break
            }
          } catch (err) {
            logger.error(err, { stream }, 'Error processing a stream!')
            failedStreams.push(stream)
          }
        }

        // postprocess integration settings
        await intService.postprocess(stepContext, processMetadata, failedStreams, streams)

        if (failedStreams.length > 0) {
          logger.warn(
            { failedStreams },
            'Some streams have not been processed successfully - retrying them with delay!',
          )

          // TODO implement retries for failed streams
        }
      } else {
        logger.warn('No streams detected!')
      }
    } catch (err) {
      logger.error(err, 'Error while processing integration!')
    } finally {
      await IntegrationRepository.update(
        integration.id,
        {
          status: 'done',
          settings: stepContext.integration.settings,
          refreshToken: stepContext.integration.refreshToken,
          token: stepContext.integration.token,
        },
        userContext,
      )
    }
  }
}
