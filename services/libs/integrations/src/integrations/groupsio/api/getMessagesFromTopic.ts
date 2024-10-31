import axios, { AxiosRequestConfig } from 'axios'

import { RateLimitError } from '@crowd/types'

import { IProcessStreamContext } from '../../../types'
import { RedisSemaphore } from '../utils/lock'

export const getMessagesFromTopic = async (
  topicId: string,
  cookie: string,
  ctx: IProcessStreamContext,
  page: string = null,
) => {
  const config: AxiosRequestConfig = {
    method: 'get',
    url:
      `https://groups.io/api/v1/gettopic?topic_id=${topicId}` + (page ? `&page_token=${page}` : ''),
    headers: {
      Cookie: cookie,
    },
  }

  const semaphore = new RedisSemaphore({
    integrationId: ctx.integration.id,
    apiCallType: 'getMessagesFromTopic',
    maxConcurrent: 1,
    cache: ctx.cache,
  })

  try {
    await semaphore.acquire()
    const response = await axios(config)
    return response.data
  } catch (err) {
    if (err?.message?.includes('429') || err?.response?.status === 429) {
      throw new RateLimitError(60 * 5, 'Rate limit when fetching member by memberInfoId!')
    }
    ctx.log.error(err, { topic_id: topicId }, 'Error fetching messags from topic_id!')
    throw err
  } finally {
    await semaphore.release()
  }
}
