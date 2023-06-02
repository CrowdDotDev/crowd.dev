import { getServiceChildLogger } from '@crowd/logging'
import { SuperfaceClient } from '@superfaceai/one-sdk'
import { timeout } from '@crowd/common'
import { cleanSuperfaceError } from '../cleanError'
import isInvalid from '../isInvalid'

const log = getServiceChildLogger('getChannels')

/**
 * Try if a channel is readable
 * @param accessToken Discord bot token
 * @param channel Channel ID
 * @returns Limit if the channel is readable, false otherwise
 */
async function tryChannel(
  client: SuperfaceClient,
  source: string,
  accessToken: string,
  channel: any,
): Promise<any> {
  try {
    const input = {
      destination: channel.id,
      limit: 1,
    }
    const profile = await client.getProfile('chat/messages')
    const provider = await client.getProvider(source)
    const result: any = await profile.getUseCase('GetMessages').perform(input, {
      provider,
      parameters: { accessToken },
    })

    if (result.value) {
      if ('rateLimit' in result.value) {
        return result.value.rateLimit.remainingRequests
      }
      return 10
    }
    return false
  } catch (err) {
    return false
  }
}

async function getChannels(
  client: SuperfaceClient,
  source: string,
  input: any,
  accessToken: string,
  tryChannels = true,
) {
  try {
    const profile = await client.getProfile('chat/channels')
    const provider = await client.getProvider(source)
    const parameters = { accessToken }
    const result: any = await profile
      .getUseCase('GetChannels')
      .perform(input, { provider, parameters })
    if (isInvalid(result, 'channels')) {
      log.warn({ input, result }, 'Invalid request in getChannels')
    }
    if (tryChannels) {
      const out: any[] = []
      for (const channel of result.value.channels) {
        const limit = await tryChannel(client, source, accessToken, channel)
        if (limit) {
          const toOut: any = {
            name: channel.name,
            id: channel.id,
          }
          out.push(toOut)
          if (limit <= 1 && limit !== false) {
            await timeout(5 * 1000)
          }
        }
      }
      return out
    }

    return result.value.channels.map((c) => ({
      name: c.name,
      id: c.id,
    }))
  } catch (err) {
    throw cleanSuperfaceError(err)
  }
}

export default getChannels

// getDestinations('877903817948147752', 'ODc3OTEwNjM0MzA4NzA2MzI0.YR5f_g.TrYuoK2yWA5-LpPlDQ0Nlzc8dOE')
