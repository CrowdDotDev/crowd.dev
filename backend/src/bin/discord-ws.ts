import { Client, Events, GatewayIntentBits, MessageType } from 'discord.js'
import { DISCORD_CONFIG } from '../config'
import { getServiceLogger } from '../utils/logging'
import SequelizeRepository from '../database/repositories/sequelizeRepository'
import IntegrationRepository from '../database/repositories/integrationRepository'
import { PlatformType } from '../types/integrationEnums'
import IncomingWebhookRepository from '../database/repositories/incomingWebhookRepository'
import { DiscordWebsocketEvent, DiscordWebsocketPayload, WebhookType } from '../types/webhooks'
import { sendNodeWorkerMessage } from '../serverless/utils/nodeWorkerSQS'
import { NodeWorkerProcessWebhookMessage } from '../types/mq/nodeWorkerProcessWebhookMessage'

const log = getServiceLogger()

setImmediate(async () => {
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
        log.warn({ guildId }, 'No integration found for incoming Discord WS Message!')
      } else {
        log.error(
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
    log.info('Discord WS client is ready!')
  })

  client.on(Events.Error, (err) => {
    log.error(err, 'Discord WS client error! Exiting...')
    process.exit(1)
  })

  client.on(Events.Debug, (message) => {
    log.debug({ debugMsg: message }, 'Discord WS client debug message!')
  })

  client.on(Events.Warn, (message) => {
    log.warn({ warning: message }, 'Discord WS client warning!')
  })

  // listen to discord events
  client.on(Events.GuildMemberAdd, async (member) => {
    log.info({ member }, 'Member joined guild!')
    await processPayload(DiscordWebsocketEvent.MEMBER_ADDED, member, member.guild.id)
  })

  client.on(Events.MessageCreate, async (message) => {
    if (message.type === MessageType.Default || message.type === MessageType.Reply) {
      log.info({ message }, 'Message created!')
      await processPayload(DiscordWebsocketEvent.MESSAGE_CREATED, message, message.guildId)
    }
  })

  client.on(Events.MessageUpdate, async (oldMessage, newMessage) => {
    if (newMessage.type === MessageType.Default) {
      log.info({ oldMessage, newMessage }, 'Message updated!')
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

  await client.login(DISCORD_CONFIG.token)
  log.info('Discord WS client logged in!')
})
