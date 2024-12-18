import axios, { AxiosRequestConfig } from 'axios'

import { RateLimitError } from '@crowd/types'

import { IProcessStreamContext } from '../../../types'
import { GroupName } from '../types'
import { RedisSemaphore } from '../utils/lock'

export const getTopicsFromGroup = async (
  groupName: GroupName,
  cookie: string,
  ctx: IProcessStreamContext,
  page: string = null,
) => {
  const config: AxiosRequestConfig = {
    method: 'get',
    url:
      `https://groups.io/api/v1/gettopics?group_name=${encodeURIComponent(
        groupName,
      )}&sort_field=updated&sort_dir=desc` + (page ? `&page_token=${page}` : ''),
    headers: {
      Cookie: cookie,
    },
  }

  const semaphore = new RedisSemaphore({
    integrationId: ctx.integration.id,
    apiCallType: 'getTopicsFromGroup',
    maxConcurrent: 1,
    cache: ctx.cache,
  })

  try {
    await semaphore.acquire()
    const response = await axios(config)
    return response.data
  } catch (err) {
    if (err?.message?.includes('429') || err?.response?.status === 429) {
      throw new RateLimitError(60 * 5, 'Rate limit when fetching topics from group!')
    }
    ctx.log.error(err, { groupName }, 'Error fetching topics from group!')
    throw err
  } finally {
    await semaphore.release()
  }
}
