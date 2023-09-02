import axios, { AxiosRequestConfig } from 'axios'
import { YoutubeVideoStreamConfig, YoutubeCommentThreadSearch } from '../types'
import { IProcessStreamContext } from '@/types'

export const getComments = async (ctx: IProcessStreamContext): Promise<YoutubeCommentThreadSearch> => {
  const videoConfig = ctx.stream.data as YoutubeVideoStreamConfig 

  try {
    const getThreadedCommentsConfig: AxiosRequestConfig = {
      method: 'get',
      url: `https://www.googleapis.com/youtube/v3/commentThreads`,
      params: {
        key: videoConfig.apiKey,
        videoId: videoConfig.videoId,
        order: 'time',
        maxResults: 100,
        part: 'snippet',
      },
    }

    const shouldLoadNextPage = videoConfig.nextPageToken && videoConfig.nextPageToken != ''
    if (shouldLoadNextPage) {
      getThreadedCommentsConfig.params.pageToken = videoConfig.nextPageToken
    }

    const response = (await axios(getThreadedCommentsConfig)).data
    return response
  } catch (err) {
    ctx.log.error(
      { err, videoConfig },
      'Error while using the youtube comments api to get a video comments',
    )
    throw err
  }
}
