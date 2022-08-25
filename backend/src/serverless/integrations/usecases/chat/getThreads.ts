import { SuperfaceClient } from '@superfaceai/one-sdk'
import { Channels } from '../../types/regularTypes'
import isInvalid from '../isInvalid'
import { PlatformType } from '../../../../utils/platforms'

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
      console.log('Invalid request in getChannels')
      console.log('Inputs: ', input)
      console.log('Result: ', result)
    }
    return result.value.threads.map((thread) => ({
      name: thread.name,
      id: thread.id,
      thread: true,
    }))
  } catch (err) {
    console.log(err)
    return err
  }
}

export default getChannels

// getDestinations('877903817948147752', 'ODc3OTEwNjM0MzA4NzA2MzI0.YR5f_g.TrYuoK2yWA5-LpPlDQ0Nlzc8dOE')
