import { SuperfaceClient } from '@superfaceai/one-sdk'
import BaseIterator from '../../iterators/baseIterator'
import { SocialResponse } from '../../types/superfaceTypes'
import isInvalid from '../isInvalid'

async function getMessagesThreads(
  client: SuperfaceClient,
  source: string,
  accessToken: string,
  endpoint: string,
  page: string,
  perPage: number = 100,
): Promise<SocialResponse> {
  const threadInfo = BaseIterator.decodeEndpoint(endpoint)
  const input = {
    destination: threadInfo.channelId,
    threadId: threadInfo.threadId,
    limit: perPage,
    page: page || undefined,
  }
  const profile = await client.getProfile('chat/messages-threads')
  const provider = await client.getProvider(source)
  const result: any = await profile.getUseCase('GetMessagesThreads').perform(input, {
    provider,
    parameters: { accessToken },
  })

  if (isInvalid(result, 'messages')) {
    console.log('Invalid request in usecase')
    console.log('Inputs: ', input)
    console.log('Result: ', result)
  }

  let limit
  let timeUntilReset
  if (result.value.rateLimit) {
    limit = result.value.rateLimit.limit
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

export default getMessagesThreads

// getMessagesThreads('909473151757455420', 'ODc3OTEwNjM0MzA4NzA2MzI0.YR5f_g.TrYuoK2yWA5-LpPlDQ0Nlzc8dOE')
