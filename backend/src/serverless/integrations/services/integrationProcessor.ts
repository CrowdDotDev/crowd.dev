import { LoggerBase } from '@crowd/logging'
import { ApiPubSubEmitter, RedisClient } from '@crowd/redis'
import { IntegrationType } from '@crowd/types'
import IntegrationRunRepository from '../../../database/repositories/integrationRunRepository'
import IntegrationStreamRepository from '../../../database/repositories/integrationStreamRepository'
import { IServiceOptions } from '../../../services/IServiceOptions'
import { NodeWorkerIntegrationProcessMessage } from '../../../types/mq/nodeWorkerIntegrationProcessMessage'
import { IntegrationCheckProcessor } from './integrationCheckProcessor'
import { IntegrationRunProcessor } from './integrationRunProcessor'
import { IntegrationTickProcessor } from './integrationTickProcessor'
import { DiscordIntegrationService } from './integrations/discordIntegrationService'
import { DiscourseIntegrationService } from './integrations/discourseIntegrationService'
import { GithubIntegrationService } from './integrations/githubIntegrationService'
import { HackerNewsIntegrationService } from './integrations/hackerNewsIntegrationService'
import { RedditIntegrationService } from './integrations/redditIntegrationService'
import { SlackIntegrationService } from './integrations/slackIntegrationService'
import { StackOverlflowIntegrationService } from './integrations/stackOverflowIntegrationService'
import { TwitterIntegrationService } from './integrations/twitterIntegrationService'
import { TwitterReachIntegrationService } from './integrations/twitterReachIntegrationService'
import { WebhookProcessor } from './webhookProcessor'

export class IntegrationProcessor extends LoggerBase {
  private readonly tickProcessor: IntegrationTickProcessor

  private readonly checkProcessor: IntegrationCheckProcessor

  private readonly webhookProcessor: WebhookProcessor

  private readonly runProcessor: IntegrationRunProcessor | undefined

  constructor(options: IServiceOptions, redisEmitterClient?: RedisClient) {
    super(options.log)

    const integrationServices = [
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

    this.log.debug(
      { supportedIntegrations: integrationServices.map((i) => i.type) },
      'Successfully detected supported integrations!',
    )

    let apiPubSubEmitter: ApiPubSubEmitter | undefined

    if (redisEmitterClient) {
      apiPubSubEmitter = new ApiPubSubEmitter(redisEmitterClient, this.log)
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
