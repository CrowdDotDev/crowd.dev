// generateStreams.ts content
import { YoutubeRootStream, YoutubeIntegrationSettings } from './types'
import { GenerateStreamsHandler } from '../../types'

const handler: GenerateStreamsHandler = async (ctx) => {
  const channelSettings = ctx.integration.settings as YoutubeIntegrationSettings

  if (channelSettings.keywords && channelSettings.keywords.length > 0) {
    const searchQuery = channelSettings.keywords.join('|')
    await ctx.publishStream(
      `${YoutubeRootStream.KEYWORDS_SEARCH}:${searchQuery}`,
      {
        ...channelSettings,
        keywords: channelSettings.keywords
      }
    )
  } else if (channelSettings.channelId) {
    await ctx.publishStream(
      `${YoutubeRootStream.UPLOADED_VIDEOS}:${channelSettings.channelId}`,
      {
        ...channelSettings
      }
    )
  }
}

export default handler
