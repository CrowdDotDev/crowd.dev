import axios, { AxiosRequestConfig } from 'axios'

import { IProcessStreamContext } from '../../../types'
import { GroupName } from '../types'
import { RedisSemaphore } from '../utils/lock'

export const getGroupMembers = async (
  groupName: GroupName,
  cookie: string,
  ctx: IProcessStreamContext,
  page = null,
) => {
  const config: AxiosRequestConfig = {
    method: 'get',
    url:
      `https://groups.io/api/v1/getmembers?group_name=${encodeURIComponent(groupName)}` +
      (page ? `&page_token=${page}` : ''),
    headers: {
      Cookie: cookie,
    },
  }

  const semaphore = new RedisSemaphore({
    integrationId: ctx.integration.id,
    apiCallType: 'getGroupMembers',
    maxConcurrent: 1,
    cache: ctx.cache,
  })

  try {
    await semaphore.acquire()
    const response = await axios(config)
    return response.data
  } catch (err) {
    ctx.log.error(err, { groupName }, 'Error fetching members from group!')
    throw err
  } finally {
    await semaphore.release()
  }
}
