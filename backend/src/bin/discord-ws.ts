import { Client, Events, GatewayIntentBits, MessageType } from 'discord.js'
import moment from 'moment'
import { timeout } from '../utils/timing'
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
import { processPaginated } from '../utils/paginationProcessing'

const log = getServiceLogger()

async function executeIfNotExists(
  key: string,
  cache: RedisCache,
  fn: () => Promise<void>,
  delayMilliseconds?: number,
) {
  if (delayMilliseconds) {
    await timeout(delayMilliseconds)
  }

  const exists = await cache.getValue(key)
  if (!exists) {
    await fn()
    await cache.setValue(key, '1', 2 * 60 * 60)
  }
}

async function spawnClient(
  name: string,
  token: string,
  cache: RedisCache,
  delayMilliseconds?: number,
) {
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
  client.on(Events.GuildMemberAdd, async (m) => {
    const member = m as any
    await executeIfNotExists(
      `member-${member.userId}`,
      cache,
      async () => {
        logger.debug(
          {
            member: member.displayName,
            guildId: member.guildId ?? member.guild.id,
            userId: member.userId,
          },
          'Member joined guild!',
        )
        await processPayload(
          DiscordWebsocketEvent.MEMBER_ADDED,
          member,
          member.guildId ?? member.guild.id,
        )
      },
      delayMilliseconds,
    )
  })

  client.on(Events.MessageCreate, async (message) => {
    if (message.type === MessageType.Default || message.type === MessageType.Reply) {
      await executeIfNotExists(
        `msg-${message.id}`,
        cache,
        async () => {
          logger.debug(
            {
              guildId: message.guildId,
              channelId: message.channelId,
              message: message.cleanContent,
              authorId: message.author,
            },
            'Message created!',
          )
          await processPayload(DiscordWebsocketEvent.MESSAGE_CREATED, message, message.guildId)
        },
        delayMilliseconds,
      )
    }
  })

  client.on(Events.MessageUpdate, async (oldMessage, newMessage) => {
    if (newMessage.type === MessageType.Default && newMessage.editedTimestamp) {
      await executeIfNotExists(
        `msg-modified-${newMessage.id}-${newMessage.editedTimestamp}`,
        cache,
        async () => {
          logger.debug(
            {
              guildId: newMessage.guildId,
              channelId: newMessage.channelId,
              oldMessageId: oldMessage.id,
              newMessage: newMessage.cleanContent,
              authorId: newMessage.author,
            },
            'Message updated!',
          )
          await processPayload(
            DiscordWebsocketEvent.MESSAGE_UPDATED,
            {
              message: newMessage,
              oldMessage,
            },
            newMessage.guildId,
          )
        },
        delayMilliseconds,
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
    const repoOptions = await SequelizeRepository.getDefaultIRepositoryOptions()

    await processPaginated(
      async (page) => IntegrationRepository.findAllActive(PlatformType.DISCORD, page, 10),
      async (integrations) => {
        log.warn(`Found ${integrations.length} integrations to trigger check for!`)
        const service = new DiscordIntegrationService()
        await service.triggerIntegrationCheck(integrations, repoOptions)
      },
    )
  }

  await spawnClient(
    'first-app',
    DISCORD_CONFIG.token,
    cache,
    DISCORD_CONFIG.token2 ? 1000 : undefined,
  )

  if (DISCORD_CONFIG.token2) {
    await spawnClient('second-app', DISCORD_CONFIG.token2, cache)
  }

  setInterval(async () => {
    await cache.setValue('heartbeat', new Date().toISOString())
  }, 2 * 1000)
})
