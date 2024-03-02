import axios, { AxiosRequestConfig } from 'axios'
import { YoutubeIntegrationStreamConfig, YoutubeVideoSearch } from '../types'
import { IProcessStreamContext } from '@/types'

export const getVideosByKeywords = async (
  ctx: IProcessStreamContext
): Promise<YoutubeVideoSearch> => {
  const channelSettings = ctx.stream.data as YoutubeIntegrationStreamConfig

  const now = new Date()
  const publishedAfter = new Date(now.getTime() - 1000 * 60 * 60 * 24 * 30) // 30 days

  try {
    const getVideosByKeywordsRequestConfig: AxiosRequestConfig = {
      method: 'get',
      url: `https://www.googleapis.com/youtube/v3/search`,
      params: {
        key: channelSettings.apiKey,
        type: 'video',
        order: 'date',
        maxResults: 50,
        publishedAfter: publishedAfter.toISOString(),
        part: 'snippet',
      },
    }

    const includesKeywords = channelSettings.keywords && channelSettings.keywords.length > 0
    if (includesKeywords) {
      // URL escape pipe(|) for the OR operator
      getVideosByKeywordsRequestConfig.params.q = channelSettings.keywords.join('%7C')
    }

    const shouldLoadNextPage = channelSettings.nextPageToken && channelSettings.nextPageToken != ''
    if (shouldLoadNextPage) {
      getVideosByKeywordsRequestConfig.params.pageToken = channelSettings.nextPageToken
    }

    const response = (await axios(getVideosByKeywordsRequestConfig)).data
    return response
  } catch (err) {
    // we've hit the limits for gettings anymore data or there's an error, anyways just log it 
    ctx.log.error(
      { err, channelSettings },
      'Error while using the youtube search api to get videos',
    )
    throw err
  }
}
