import { getServiceChildLogger } from '@crowd/logging'
import { SuperfaceClient } from '@superfaceai/one-sdk'
import { SocialResponse } from '../../types/superfaceTypes'
import { cleanSuperfaceError } from '../cleanError'
import isInvalid from '../isInvalid'

const log = getServiceChildLogger('getMembers')

async function getMembers(
  client: SuperfaceClient,
  source: string,
  accessToken: string,
  server: string,
  page: string,
  perPage: number = 100,
): Promise<SocialResponse> {
  try {
    const input: any = {
      limit: perPage,
      page: page || undefined,
    }
    if (server) {
      input.server = server
    }

    const profile = await client.getProfile('chat/members')
    const provider = await client.getProvider(source)
    const result: any = await profile.getUseCase('GetMembers').perform(input, {
      provider,
      parameters: { accessToken },
    })

    if (isInvalid(result, 'members')) {
      log.warn({ input, result }, 'Invalid request in hashtag')
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
      records: result.value.members,
      nextPage: result.value.members.length < input.limit ? undefined : result.value.nextPage,
      limit,
      timeUntilReset,
    }
  } catch (err) {
    throw cleanSuperfaceError(err)
  }
}

export default getMembers
