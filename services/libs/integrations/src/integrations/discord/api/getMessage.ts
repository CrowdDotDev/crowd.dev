import axios, { AxiosRequestConfig } from 'axios'
import { handleDiscordError } from './errorHandler'
import { IProcessStreamContext } from '@/types'

export const getMessage = async (
  channelId: string,
  messageId: string,
  token: string,
  ctx: IProcessStreamContext,
) => {
  const config: AxiosRequestConfig = {
    method: 'get',
    url: `https://discord.com/api/v10/channels/${channelId}/messages/${messageId}`,
    headers: {
      Authorization: token,
    },
  }

  try {
    const response = await axios(config)
    return response.data
  } catch (err) {
    const newErr = handleDiscordError(err, config, { channelId, messageId }, ctx)
    throw newErr
  }
}
