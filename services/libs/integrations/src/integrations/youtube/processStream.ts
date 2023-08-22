// processStream.ts content
import { YoutubeRootStream, YoutubeIntegrationSettings, YoutubeVideoStreamConfig } from './types'
import { getVideos } from './api/videos'
import { getComments } from './api/comments'
import { getVideosByKeywords } from './api/videosByKeywords'
import { IProcessStreamContext, ProcessStreamHandler } from '../../types'

const handler: ProcessStreamHandler = async (ctx) => {
  if (ctx.stream.identifier.startsWith(YoutubeRootStream.UPLOADED_VIDEOS)) {
    await handleChannelStream(ctx)
  } else if (ctx.stream.identifier.startsWith(YoutubeRootStream.KEYWORDS_SEARCH)) {
    await handleKeywordsSearchStream(ctx)
  } else {
    await handleVideoStream(ctx)
  }
}

async function handleChannelStream(ctx: IProcessStreamContext) {
  const channelSettings = ctx.stream.data as YoutubeIntegrationSettings
  const videos = await getVideos(ctx)

  for (const video of videos.items) {
    const videoId = video.id.videoId

    await ctx.publishStream(`${YoutubeRootStream.CHANNEL_VIDEO}:${videoId}`, {
      title: video.snippet.title,
      videoId,
      apiKey: channelSettings.apiKey
    })
  }

  const shouldLoadNextPage = videos.nextPageToken && videos.nextPageToken != ''
  if (shouldLoadNextPage) {
    await ctx.publishStream(
      `${YoutubeRootStream.UPLOADED_VIDEOS}:${channelSettings.channelId}:${channelSettings.nextPageToken}`,
      {
        ...channelSettings,
        nextPageToken: videos.nextPageToken
      },
    )
  }
}

async function handleKeywordsSearchStream(ctx: IProcessStreamContext) {
  const channelSettings = ctx.stream.data as YoutubeIntegrationSettings 
  const videos = await getVideosByKeywords(ctx)

  for (const video of videos.items) {
    const videoId = video.id.videoId

    await ctx.publishStream(`${YoutubeRootStream.CHANNEL_VIDEO}:${videoId}`, {
      title: video.snippet.title,
      videoId,
      apiKey: channelSettings.apiKey
    })
  }
}

async function handleVideoStream(ctx: IProcessStreamContext) {
  const videoConfig = ctx.stream.data as YoutubeVideoStreamConfig 
  const comments = await getComments(ctx)

  await ctx.publishData({ video: videoConfig, comments: comments })

  const shouldLoadNextPage = comments.nextPageToken && comments.nextPageToken != ''
  if (shouldLoadNextPage) {
    await ctx.publishStream(`${YoutubeRootStream.CHANNEL_VIDEO}:${videoConfig.videoId}:${comments.nextPageToken}`, {
      ...videoConfig,
      nextPageToken: comments.nextPageToken
    })
  }
}

export default handler
