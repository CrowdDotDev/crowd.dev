import axios, { AxiosRequestConfig } from 'axios'
import { YoutubeIntegrationSettings, YoutubeVideoSearch } from '../types'
import { IProcessStreamContext } from '@/types'

export const getVideos = async (ctx: IProcessStreamContext): Promise<YoutubeVideoSearch> => {
  const channelSettings = ctx.stream.data as YoutubeIntegrationSettings

  try {
    const getChannelVideosConfig: AxiosRequestConfig = {
      method: 'get',
      url: `https://www.googleapis.com/youtube/v3/search`,
      params: {
        key: channelSettings.apiKey,
        channelId: channelSettings.channelId,
        type: 'video',
        order: 'date',
        maxResults: 50,
        part: 'snippet'
      }
    }

    const shouldLoadNextPage = channelSettings.nextPageToken && channelSettings.nextPageToken != ''
    if (shouldLoadNextPage) {
      getChannelVideosConfig.params.pageToken = channelSettings.nextPageToken
    }

    const response = (await axios(getChannelVideosConfig)).data
    return response
  } catch (err) {
    // we've hit the limits for gettings data or there's an error, anyway just log it 
    ctx.log.error(
      { err, channelSettings },
      'Error while using the youtube search api to get videos',
    )
    throw err
  }
}
