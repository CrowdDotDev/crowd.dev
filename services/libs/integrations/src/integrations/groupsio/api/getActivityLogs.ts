import axios, { AxiosRequestConfig } from 'axios'

import { IProcessStreamContext } from '../../../types'
import { GroupName } from '../types'
import { RedisSemaphore } from '../utils/lock'
import { RateLimitError } from '@crowd/types'

export const getActivityLogs = async (
  groupName: GroupName,
  cookie: string,
  ctx: IProcessStreamContext,
  page = null,
) => {
  const config: AxiosRequestConfig = {
    method: 'get',
    url:
      `https://groups.io/api/v1/getactivitylog?limit=100&sort_field=created&sort_dir=asc&group_name=${encodeURIComponent(
        groupName,
      )}` + (page ? `&page_token=${page}` : ''),
    headers: {
      Cookie: cookie,
    },
  }

  const semaphore = new RedisSemaphore({
    integrationId: ctx.integration.id,
    apiCallType: 'getActivityLogs',
    maxConcurrent: 1,
    cache: ctx.cache,
  })

  try {
    await semaphore.acquire()
    const response = await axios(config)
    return response.data
  } catch (err) {
    if (err?.message?.includes('429') || err?.response?.status === 429) {
      throw new RateLimitError(
        60 * 5,
        'Rate limit when fetching activity logs from group!',
      )
    }
    ctx.log.error(err, { groupName }, 'Error fetching activity logs from group!')
    throw err
  } finally {
    await semaphore.release()
  }
}
