import axios, { AxiosRequestConfig } from 'axios'
import { IProcessStreamContext } from '../../../types'
import { GroupName } from '../types'

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

  try {
    const response = await axios(config)
    return response.data
  } catch (err) {
    ctx.log.error(err, { groupName }, 'Error fetching members from group!')
    throw err
  }
}
