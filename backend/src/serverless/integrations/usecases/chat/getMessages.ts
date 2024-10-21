import { SuperfaceClient } from '@superfaceai/one-sdk'

import { SocialResponse } from '../../types/superfaceTypes'
import { cleanSuperfaceError } from '../cleanError'

async function getMessages(
  client: SuperfaceClient,
  source: string,
  accessToken: string,
  channelId: string,
  page: string,
  perPage: number = 100,
): Promise<SocialResponse> {
  try {
    const input = {
      destination: channelId,
      limit: perPage,
      page: page || undefined,
    }
    const profile = await client.getProfile('chat/messages')
    const provider = await client.getProvider(source)
    const result: any = await profile.getUseCase('GetMessages').perform(input, {
      provider,
      parameters: { accessToken },
    })

    // TODO No-SF, do we need this?
    // if ('error' in result) {
    //   if (result.error.statusCode === 500) {
    //     log.error(result.error, `Error in messages: ${result.error.properties.detail}`)
    //     return {
    //       records: [],
    //       nextPage: page,
    //       limit: 0,
    //       timeUntilReset: 180,
    //     }
    //   }
    // }

    let limit
    let timeUntilReset
    if (result.value.rateLimit) {
      limit = result.value.rateLimit.remainingRequests
      timeUntilReset = result.value.rateLimit.resetAfter
    } else {
      limit = 100
      timeUntilReset = 1
    }

    return {
      records: result.value.messages,
      nextPage: result.value.messages.length < input.limit ? '' : result.value.nextPage,
      limit,
      timeUntilReset,
    }
  } catch (err) {
    throw cleanSuperfaceError(err)
  }
}

export default getMessages
