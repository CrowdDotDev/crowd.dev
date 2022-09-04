import { BaseOutput, DiscordOutput } from '../types/iteratorTypes'
import { Channels } from '../types/regularTypes'
import { DiscordIntegrationMessage } from '../types/messageTypes'
import DiscordIterator from '../iterators/discordIterator'
import getChannels from '../usecases/chat/getChannels'
import getThreads from '../usecases/chat/getThreads'
import getUserContext from '../../../database/utils/getUserContext'
import IntegrationRepository from '../../../database/repositories/integrationRepository'
import BaseIterator from '../iterators/baseIterator'
import { PlatformType } from '../../../utils/platforms'
import MemberAttributeSettingsService from '../../../services/memberAttributeSettingsService'
import { DiscordMemberAttributes } from '../../../database/attributes/member/discord'

/**
 * Discord worker that is responsible for consuming the discord integration messages
 * that were pushed to the message queue. Each message contains information about
 * a project's discord integration.
 *
 * To keep track of newly created channels, we save the channels that are already onboarded
 * in project.integrations.discord.channels. When there is a new channel by cross-checking
 * with this list we can tell the iterator which channels are new so history should be
 * parsed for those channels as well.
 *
 * If the iterator returns a success message project.integrations.discord.channels is updated.
 *
 * @param body {DiscordIntegrationMessage}
 * @returns {DiscordOutput}
 */

async function discordWorker(body: DiscordIntegrationMessage): Promise<DiscordOutput> {
  try {
    console.log('Starting Discord worker with body, ', body)
    const { state, tenant, onboarding, args } = body
    const { guildId } = args
    const botToken: string = process.env.DISCORD_TOKEN

    // Initialising the superface client here and passing it to the iterator
    // since we need it to get the channels from the slack api.
    // TODO: the future we can get channels in the iterator.
    const superfaceClient = DiscordIterator.initSuperfaceClient()

    // This will get get all active threads
    const threads: Channels = await getThreads(superfaceClient, guildId, botToken)

    // This will get all channels that we have acceess to (private or public)
    let channelsFromDiscordAPI: Channels = await getChannels(
      superfaceClient,
      PlatformType.DISCORD,
      { server: guildId.toString() },
      botToken,
    )

    // Inject user and tenant to IRepositoryOptions
    const userContext = await getUserContext(tenant)

    await new MemberAttributeSettingsService(userContext).createPredefined(DiscordMemberAttributes)

    // We already have the tenant filter in userContext
    // because of getCurrentTenant function in the repo layer.
    // Therefore we can feed an empty query object as first arg
    const integration = await IntegrationRepository.findByPlatform(
      PlatformType.DISCORD,
      userContext,
    )

    if (integration.settings.updateMemberAttributes) {
      await new MemberAttributeSettingsService(userContext).createPredefined(
        DiscordMemberAttributes,
      )

      integration.settings.updateMemberAttributes = false

      await IntegrationRepository.update(
        integration.id,
        { settings: integration.settings },
        userContext,
      )
    }

    const channels = integration.settings.channels ? integration.settings.channels : []

    // Add bool new property to new channels
    channelsFromDiscordAPI = channelsFromDiscordAPI.map((c) => {
      if (channels.filter((a) => a.id === c.id).length <= 0) {
        return { ...c, new: true }
      }
      return c
    })

    const channelsWithThreads = channelsFromDiscordAPI.concat(threads)

    console.log('Sleeping')
    await BaseIterator.sleep(1)

    const discordIterator = new DiscordIterator(
      superfaceClient,
      tenant,
      guildId,
      botToken,
      channelsWithThreads,
      state,
      onboarding,
    )
    const iterationResult = await discordIterator.iterate()

    const successStatus: BaseOutput = DiscordIterator.success as BaseOutput
    console.log('Discord worker iteration result, ', iterationResult)

    // If iteration is returns a finsihed state, update the project's integration channels
    // channels should be in the JSONB field
    if (
      iterationResult.status === successStatus.status &&
      iterationResult.msg === successStatus.msg
    ) {
      console.log('Updating channels')

      // strip the new property from channels
      const channelsRaw = channelsFromDiscordAPI.map((ch) => {
        const { new: _, ...raw } = ch
        return raw
      })

      integration.settings.channels = channelsRaw
      await IntegrationRepository.update(
        integration.id,
        {
          settings: integration.settings,
        },
        userContext,
      )
    }

    return iterationResult
  } catch (err) {
    console.log('Discord worker error, ', err)
    throw err
  }
}

export default discordWorker
