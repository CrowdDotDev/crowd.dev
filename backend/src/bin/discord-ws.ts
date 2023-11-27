import { Client, Events, GatewayIntentBits, MessageType } from 'discord.js'
import moment from 'moment'
import { processPaginated, timeout } from '@crowd/common'
import { RedisCache, getRedisClient, RedisClient } from '@crowd/redis'
import { getChildLogger, getServiceLogger } from '@crowd/logging'
import { PlatformType } from '@crowd/types'
import { SpanStatusCode, getServiceTracer } from '@crowd/tracing'
import fs from 'fs'
import path from 'path'
import { DISCORD_CONFIG, REDIS_CONFIG } from '../conf'
import SequelizeRepository from '../database/repositories/sequelizeRepository'
import IntegrationRepository from '../database/repositories/integrationRepository'
import IncomingWebhookRepository from '../database/repositories/incomingWebhookRepository'
import { DiscordWebsocketEvent, DiscordWebsocketPayload, WebhookType } from '../types/webhooks'
import {
  getIntegrationRunWorkerEmitter,
  getIntegrationStreamWorkerEmitter,
} from '@/serverless/utils/serviceSQS'

const tracer = getServiceTracer()
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

  const exists = await cache.get(key)
  if (!exists) {
    await fn()
    await cache.set(key, '1', 2 * 60 * 60)
  }
}

async function spawnClient(
  name: string,
  token: string,
  cache: RedisCache,
  delayMilliseconds?: number,
) {
  const logger = getChildLogger('discord-ws', log, { clientName: name })

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

    logger.info({ payload }, 'Processing Discord WS Message!')

    await tracer.startActiveSpan('ProcessDiscordWSMessage', async (span) => {
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

        const streamEmitter = await getIntegrationStreamWorkerEmitter()

        await streamEmitter.triggerWebhookProcessing(
          integration.tenantId,
          integration.platform,
          result.id,
        )
        span.setStatus({
          code: SpanStatusCode.OK,
        })
      } catch (err) {
        if (err.code === 404) {
          logger.warn({ guildId }, 'No integration found for incoming Discord WS Message!')
        } else {
          span.setStatus({
            code: SpanStatusCode.ERROR,
            message: err,
          })
          logger.error(
            err,
            {
              discordPayload: JSON.stringify(payload),
              guildId,
            },
            'Error processing Discord WS Message!',
          )
        }
      } finally {
        span.end()
      }
    })
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

let redis: RedisClient
const initRedis = async () => {
  if (redis) return
  redis = await getRedisClient(REDIS_CONFIG, true)
}

setImmediate(async () => {
  // we are saving heartbeat timestamps in redis every 2 seconds
  // on boot if we detect that there has been a downtime we should trigger discord integration checks
  // so we don't miss anything
  await initRedis()
  const cache = new RedisCache('discord-ws', redis, log)

  const lastHeartbeat = await cache.get('heartbeat')
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
    const emitter = await getIntegrationRunWorkerEmitter()

    await processPaginated(
      async (page) => IntegrationRepository.findAllActive(PlatformType.DISCORD, page, 10),
      async (integrations) => {
        log.warn(`Found ${integrations.length} integrations to trigger check for!`)
        for (const integration of integrations) {
          await emitter.triggerIntegrationRun(
            integration.tenantId,
            integration.platform,
            integration.id,
            false,
          )
        }
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
    await cache.set('heartbeat', new Date().toISOString())
  }, 2 * 1000)
})

const liveFilePath = path.join(__dirname, 'discord-ws-live.tmp')
const readyFilePath = path.join(__dirname, 'discord-ws-ready.tmp')

setInterval(async () => {
  try {
    log.debug('Checking liveness and readiness for discord ws.')
    const res = (await redis.ping()) === 'PONG'
    if (res) {
      await Promise.all([
        fs.promises.open(liveFilePath, 'a').then((file) => file.close()),
        fs.promises.open(readyFilePath, 'a').then((file) => file.close()),
      ])
    }
  } catch (err) {
    log.error(`Error checking liveness and readiness for discord ws: ${err}`)
  }
}, 5000)
