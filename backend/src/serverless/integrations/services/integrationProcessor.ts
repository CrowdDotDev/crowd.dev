import fs from 'fs'
import path from 'path'
import IntegrationRunRepository from '../../../database/repositories/integrationRunRepository'
import IntegrationStreamRepository from '../../../database/repositories/integrationStreamRepository'
import { IServiceOptions } from '../../../services/IServiceOptions'
import { LoggingBase } from '../../../services/loggingBase'
import { IntegrationType } from '../../../types/integrationEnums'
import { NodeWorkerIntegrationProcessMessage } from '../../../types/mq/nodeWorkerIntegrationProcessMessage'
import { RedisClient } from '../../../utils/redis'
import RedisPubSubEmitter from '../../../utils/redis/pubSubEmitter'
import { IntegrationCheckProcessor } from './integrationCheckProcessor'
import { IntegrationRunProcessor } from './integrationRunProcessor'
import { DevtoIntegrationService } from './integrations/devtoIntegrationService'
import { DiscordIntegrationService } from './integrations/discordIntegrationService'
import { GithubIntegrationService } from './integrations/githubIntegrationService'
import { HackerNewsIntegrationService } from './integrations/hackerNewsIntegrationService'
import { RedditIntegrationService } from './integrations/redditIntegrationService'
import { SlackIntegrationService } from './integrations/slackIntegrationService'
import { StackOverlflowIntegrationService } from './integrations/stackOverflowIntegrationService'
import { TwitterIntegrationService } from './integrations/twitterIntegrationService'
import { TwitterReachIntegrationService } from './integrations/twitterReachIntegrationService'
import { DiscourseIntegrationService } from './integrations/discourseIntegrationService'
import { IntegrationServiceBase } from './integrationServiceBase'
import { IntegrationTickProcessor } from './integrationTickProcessor'
import { WebhookProcessor } from './webhookProcessor'

export class IntegrationProcessor extends LoggingBase {
  private readonly tickProcessor: IntegrationTickProcessor

  private readonly checkProcessor: IntegrationCheckProcessor

  private readonly webhookProcessor: WebhookProcessor

  private readonly runProcessor: IntegrationRunProcessor | undefined

  constructor(options: IServiceOptions, redisEmitterClient?: RedisClient) {
    super(options)

    const integrationServices = [
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
        integrationServices.push(...premiumIntegrations)
        this.log.info(`Loaded ${premiumIntegrations.length} premium integrations!`)
      }
    }

    this.log.debug(
      { supportedIntegrations: integrationServices.map((i) => i.type) },
      'Successfully detected supported integrations!',
    )

    let apiPubSubEmitter: RedisPubSubEmitter | undefined

    if (redisEmitterClient) {
      apiPubSubEmitter = new RedisPubSubEmitter('api-pubsub', redisEmitterClient, (err) => {
        this.log.error({ err }, 'Error in api-ws emitter!')
      })
    }

    const integrationRunRepository = new IntegrationRunRepository(options)
    const integrationStreamRepository = new IntegrationStreamRepository(options)

    this.tickProcessor = new IntegrationTickProcessor(
      options,
      integrationServices,
      integrationRunRepository,
    )

    this.checkProcessor = new IntegrationCheckProcessor(
      options,
      integrationServices,
      integrationRunRepository,
    )

    this.webhookProcessor = new WebhookProcessor(options, integrationServices)

    if (apiPubSubEmitter) {
      this.runProcessor = new IntegrationRunProcessor(
        options,
        integrationServices,
        integrationRunRepository,
        integrationStreamRepository,
        apiPubSubEmitter,
      )
    } else {
      this.log.warn('No apiPubSubEmitter provided, runProcessor will not be initialized!')
    }
  }

  async processTick() {
    await this.tickProcessor.processTick()
  }

  async processCheck(type: IntegrationType) {
    await this.checkProcessor.processCheck(type)
  }

  async processWebhook(webhookId: string, force?: boolean, fireCrowdWebhooks?: boolean) {
    await this.webhookProcessor.processWebhook(webhookId, force, fireCrowdWebhooks)
  }

  async process(req: NodeWorkerIntegrationProcessMessage) {
    if (this.runProcessor) {
      await this.runProcessor.process(req)
    } else {
      throw new Error('runProcessor is not initialized!')
    }
  }
}
