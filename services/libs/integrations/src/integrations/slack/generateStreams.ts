import { GenerateStreamsHandler } from '../../types'
import { ISlackIntegrationSettings, SlackStreamType, ISlackRootSteamData } from './types'

const handler: GenerateStreamsHandler = async (ctx) => {
  const settings = ctx.integration.settings as ISlackIntegrationSettings
  const token = ctx.integration.token

  const channels = settings?.channels || []

  if (!token) {
    await ctx.abortRunWithError('No Slack token found, aborting run!')
  }

  await ctx.publishStream<ISlackRootSteamData>(`${SlackStreamType.ROOT}`, {
    token,
    channels,
  })
}

export default handler
