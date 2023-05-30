import { getServiceChildLogger } from '@crowd/logging'
import { SuperfaceClient } from '@superfaceai/one-sdk'
import { PlatformType } from '@crowd/types'
import { cleanSuperfaceError } from '../cleanError'
import isInvalid from '../isInvalid'

const log = getServiceChildLogger('getThreads')

async function getChannels(
  client: SuperfaceClient,
  serverId: string,
  accessToken: string,
): Promise<any[]> {
  try {
    const input = { server: serverId.toString() }
    const profile = await client.getProfile('chat/threads')
    const provider = await client.getProvider(PlatformType.DISCORD)
    const result: any = await profile.getUseCase('GetThreads').perform(input, {
      provider,
      parameters: { accessToken },
    })
    if (isInvalid(result, 'threads')) {
      log.warn({ input, result }, 'Invalid request in getChannels')
    }
    return result.value.threads.map((thread) => ({
      name: thread.name,
      id: thread.id,
      thread: true,
    }))
  } catch (err) {
    throw cleanSuperfaceError(err)
  }
}

export default getChannels
