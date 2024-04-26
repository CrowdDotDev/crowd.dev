import axios, { AxiosRequestConfig } from 'axios'
import { IProcessStreamContext } from '../../../types'
import { GroupName } from '../types'

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

  try {
    const response = await axios(config)
    return response.data
  } catch (err) {
    ctx.log.error(err, { groupName }, 'Error fetching activity logs from group!')
    throw err
  }
}
