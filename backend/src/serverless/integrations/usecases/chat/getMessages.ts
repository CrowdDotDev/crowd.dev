import { SuperfaceClient } from '@superfaceai/one-sdk'
import { createServiceChildLogger } from '../../../../utils/logging'
import { SocialResponse } from '../../types/superfaceTypes'
import isInvalid from '../isInvalid'

const log = createServiceChildLogger('getChannels')

async function getMessages(
  client: SuperfaceClient,
  source: string,
  accessToken: string,
  channelId: string,
  page: string,
  perPage: number = 100,
): Promise<SocialResponse> {
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

  if (isInvalid(result, 'messages')) {
    log.warn({ input, result }, 'Invalid request in get messages')
  }

  if ('error' in result) {
    if (result.error.statusCode === 429) {
      log.warn(
        `Rate limit exceeded in Get Messages. Wait value in header is ${result.error.properties.rateLimit.retryAfter}`,
      )
      return {
        records: [],
        nextPage: page,
        limit: 0,
        timeUntilReset: result.error.properties.rateLimit.retryAfter,
      }
    }

    if (result.error.statusCode === 500) {
      log.error(result.error, `Error in messages: ${result.error.properties.detail}`)
      return {
        records: [],
        nextPage: page,
        limit: 0,
        timeUntilReset: 180,
      }
    }
  }

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
}

export default getMessages

// getMessages('909473151757455420', 'ODc3OTEwNjM0MzA4NzA2MzI0.YR5f_g.TrYuoK2yWA5-LpPlDQ0Nlzc8dOE')
