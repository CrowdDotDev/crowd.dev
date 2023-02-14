import { Client, Events, GatewayIntentBits, MessageType } from 'discord.js'
import moment from 'moment'
import { DISCORD_CONFIG } from '../config'
import { createChildLogger, getServiceLogger } from '../utils/logging'
import SequelizeRepository from '../database/repositories/sequelizeRepository'
import IntegrationRepository from '../database/repositories/integrationRepository'
import { PlatformType } from '../types/integrationEnums'
import IncomingWebhookRepository from '../database/repositories/incomingWebhookRepository'
import { DiscordWebsocketEvent, DiscordWebsocketPayload, WebhookType } from '../types/webhooks'
import { sendNodeWorkerMessage } from '../serverless/utils/nodeWorkerSQS'
import { NodeWorkerProcessWebhookMessage } from '../types/mq/nodeWorkerProcessWebhookMessage'
import { createRedisClient } from '../utils/redis'
import { RedisCache } from '../utils/redis/redisCache'
import { DiscordIntegrationService } from '../serverless/integrations/services/integrations/discordIntegrationService'

const log = getServiceLogger()

async function spawnClient(name: string, token: string) {
  const logger = createChildLogger('discord-ws', log, { clientName: name })

  const repoOptions = await SequelizeRepository.getDefaultIRepositoryOptions()
  const repo = new IncomingWebhookRepository(repoOptions)

  const processPayload = async (
    event: DiscordWebsocketEvent,
    data: any,
    guildId: string,
  ): Promise<void> => {
    const payload: DiscordWebsocketPayload = {
      event,
      data,
    }

    try {
      const integration = (await IntegrationRepository.findByIdentifier(
        guildId,
        PlatformType.DISCORD,
      )) as any

      const result = await repo.create({
        tenantId: integration.tenantId,
        integrationId: integration.id,
        type: WebhookType.DISCORD,
        payload,
      })

      await sendNodeWorkerMessage(
        integration.tenantId,
        new NodeWorkerProcessWebhookMessage(integration.tenantId, result.id),
      )
    } catch (err) {
      if (err.code === 404) {
        logger.warn({ guildId }, 'No integration found for incoming Discord WS Message!')
      } else {
        logger.error(
          err,
          {
            discordPayload: JSON.stringify(payload),
            guildId,
          },
          'Error processing Discord WS Message!',
        )
      }
    }
  }

  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.GuildMessageReactions,
      GatewayIntentBits.DirectMessages,
      GatewayIntentBits.DirectMessageReactions,
      GatewayIntentBits.MessageContent,
    ],
  })

  // listen to client events
  client.on(Events.ClientReady, () => {
    logger.info('Discord WS client is ready!')
  })

  client.on(Events.Error, (err) => {
    logger.error(err, 'Discord WS client error! Exiting...')
    process.exit(1)
  })

  client.on(Events.Debug, (message) => {
    logger.debug({ debugMsg: message }, 'Discord WS client debug message!')
  })

  client.on(Events.Warn, (message) => {
    logger.warn({ warning: message }, 'Discord WS client warning!')
  })

  // listen to discord events
  client.on(Events.GuildMemberAdd, async (member) => {
    logger.info({ member }, 'Member joined guild!')
    await processPayload(DiscordWebsocketEvent.MEMBER_ADDED, member, member.guild.id)
  })

  client.on(Events.MessageCreate, async (message) => {
    if (message.type === MessageType.Default || message.type === MessageType.Reply) {
      logger.info({ message }, 'Message created!')
      await processPayload(DiscordWebsocketEvent.MESSAGE_CREATED, message, message.guildId)
    }
  })

  client.on(Events.MessageUpdate, async (oldMessage, newMessage) => {
    if (newMessage.type === MessageType.Default) {
      logger.info({ oldMessage, newMessage }, 'Message updated!')
      await processPayload(
        DiscordWebsocketEvent.MESSAGE_UPDATED,
        {
          message: newMessage,
          oldMessage,
        },
        newMessage.guildId,
      )
    }
  })

  await client.login(token)
  logger.info('Discord WS client logged in!')
}

setImmediate(async () => {
  // we are saving heartbeat timestamps in redis every 2 seconds
  // on boot if we detect that there has been a downtime we should trigger discord integration checks
  // so we don't miss anything
  const redis = await createRedisClient(true)
  const cache = new RedisCache('discord-ws', redis)

  const lastHeartbeat = await cache.getValue('heartbeat')
  let triggerCheck = false
  if (!lastHeartbeat) {
    log.info('No heartbeat found, triggering check!')
    triggerCheck = true
  } else {
    const diff = moment().diff(lastHeartbeat, 'seconds')
    // if we do rolling update deploys (kubernetes default)
    // we might catch a heartbeat without the need to trigger a check
    if (diff > 5) {
      log.warn('Heartbeat is stale, triggering check!')
      triggerCheck = true
    }
  }

  if (triggerCheck) {
    const integrations = await IntegrationRepository.findAllActive(PlatformType.DISCORD)
    if (integrations.length > 0) {
      log.warn(`Found ${integrations.length} integrations to trigger check for!`)
      const service = new DiscordIntegrationService()
      await service.triggerIntegrationCheck(integrations)
    } else {
      log.warn('Found no integrations to trigger check for!')
    }
  }

  await spawnClient('first-app', DISCORD_CONFIG.token)

  if (DISCORD_CONFIG.token2) {
    await spawnClient('second-app', DISCORD_CONFIG.token2)
  }

  setInterval(async () => {
    await cache.setValue('heartbeat', new Date().toISOString())
  }, 2 * 1000)
})
