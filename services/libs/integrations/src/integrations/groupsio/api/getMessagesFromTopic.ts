import axios, { AxiosRequestConfig } from 'axios'
import { IProcessStreamContext } from '@/types'

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

  try {
    const response = await axios(config)
    return response.data
  } catch (err) {
    ctx.log.error(err, { topic_id: topicId }, 'Error fetching messags from topic_id!')
    throw err
  }
}
