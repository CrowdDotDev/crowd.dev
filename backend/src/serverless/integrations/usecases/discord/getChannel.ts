import axios, { AxiosRequestConfig } from 'axios'
import { Logger } from '../../../../utils/logging'
import { handleDiscordError } from './errorHandler'

export const getChannel = async (
  channelId: string,
  token: string,
  logger: Logger,
): Promise<any> => {
  const config: AxiosRequestConfig<any> = {
    method: 'get',
    url: `https://discord.com/api/v10/channels/${channelId}`,
    headers: {
      Authorization: token,
    },
  }

  try {
    const response = await axios(config)
    return response.data
  } catch (err) {
    const newErr = handleDiscordError(err, config, { channelId }, logger)
    throw newErr
  }
}
