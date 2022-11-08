import { SuperfaceClient } from '@superfaceai/one-sdk'
import { Channels } from '../../types/regularTypes'
import isInvalid from '../isInvalid'
import { PlatformType } from '../../../../types/integrationEnums'
import { createServiceChildLogger } from '../../../../utils/logging'

const log = createServiceChildLogger('getThreads')

async function getChannels(
  client: SuperfaceClient,
  serverId: string,
  accessToken: string,
): Promise<Channels> {
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
    log.error(err, 'Error fetching threads!')
    throw err
  }
}

export default getChannels
