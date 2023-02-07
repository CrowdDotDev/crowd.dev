import axios, { AxiosRequestConfig } from 'axios'
import { DiscordMember } from '../../types/discordTypes'
import { Logger } from '../../../../utils/logging'
import { handleDiscordError } from './errorHandler'

export const getMember = async (
  guildId: string,
  userId: string,
  token: string,
  logger: Logger,
): Promise<DiscordMember> => {
  const config: AxiosRequestConfig<any> = {
    method: 'get',
    url: `https://discord.com/api/v10/guilds/${guildId}/members/${userId}`,
    headers: {
      Authorization: token,
    },
  }

  try {
    const response = await axios(config)
    return response.data
  } catch (err) {
    const newErr = handleDiscordError(err, config, { guildId, userId }, logger)
    throw newErr
  }
}
