import { GenerateStreamsHandler } from '../../types'
import { ISlackIntegrationSettings, SlackStreamType, ISlackRootSteamData } from './types'

const handler: GenerateStreamsHandler = async (ctx) => {
  const settings = ctx.integration.settings as ISlackIntegrationSettings

  if (settings.channels.length === 0) {
    await ctx.abortRunWithError('No subreddits configured!')
    return
  }

  await ctx.publishStream<ISlackRootSteamData>(`${SlackStreamType.ROOT}:${settings.token}`, {
    token: settings.token,
    channels: settings.channels,
  })
}

export default handler
