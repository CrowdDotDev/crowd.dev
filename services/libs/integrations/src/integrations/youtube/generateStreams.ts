// generateStreams.ts content
import { YoutubeRootStream, YoutubeIntegrationSettings } from './types'
import { GenerateStreamsHandler } from '../../types'

const handler: GenerateStreamsHandler = async (ctx) => {
  const channelSettings = ctx.integration.settings as YoutubeIntegrationSettings

  if (!channelSettings.apiKey) {
    await ctx.abortRunWithError('Api key must be provided')
    return
  }

  if (channelSettings.keywords && channelSettings.keywords.length > 0) {
    const searchQuery = channelSettings.keywords.join('|')
    await ctx.publishStream(
      `${YoutubeRootStream.KEYWORDS_SEARCH}:${searchQuery}`,
      {
        ...channelSettings
      }
    )
  } else if (channelSettings.channelId) {
    await ctx.publishStream(
      `${YoutubeRootStream.UPLOADED_VIDEOS}:${channelSettings.channelId}`,
      {
        ...channelSettings
      }
    )
  } else {
    await ctx.abortRunWithError('No channel id or keywords provided')
  }
}

export default handler
