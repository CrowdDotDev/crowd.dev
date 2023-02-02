import { SuperfaceClient } from '@superfaceai/one-sdk'
import isInvalid from '../isInvalid'
import { PlatformType } from '../../../../types/integrationEnums'
import { createServiceChildLogger } from '../../../../utils/logging'
import { cleanSuperfaceError } from '../cleanError'

const log = createServiceChildLogger('getThreads')

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
