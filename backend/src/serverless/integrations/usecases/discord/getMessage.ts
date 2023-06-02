import axios, { AxiosRequestConfig } from 'axios'
import { Logger } from '@crowd/logging'
import { handleDiscordError } from './errorHandler'

export const getMessage = async (
  channelId: string,
  messageId: string,
  token: string,
  logger: Logger,
): Promise<any> => {
  const config: AxiosRequestConfig<any> = {
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
    const newErr = handleDiscordError(err, config, { channelId, messageId }, logger)
    throw newErr
  }
}
