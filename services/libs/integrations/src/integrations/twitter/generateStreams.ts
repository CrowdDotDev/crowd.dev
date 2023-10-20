import { GenerateStreamsHandler } from '../../types'
import { IGenerateStreamsContext } from '../../types'
import axios from 'axios'
import { TwitterPlatformSettings } from './types'

const refreshToken = async (ctx: IGenerateStreamsContext) => {
  const refreshToken = ctx.integration.refreshToken
  const TWITTER_CONFIG = ctx.platformSettings as TwitterPlatformSettings

  try {
    const response = await axios.post('https://api.twitter.com/2/oauth2/token', null, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      params: {
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
        client_id: TWITTER_CONFIG.clientId,
      },
    })

    const { access_token, refresh_token } = response.data

    await ctx.updateIntegrationSettings({
      accessToken: access_token,
      refreshToken: refresh_token,
    })
  } catch (e) {
    ctx.abortRunWithError(
      'Error refreshing Twitter token, aborting run',
      {
        refreshToken,
        TWITTER_CONFIG,
      },
      e,
    )
  }
}

const handler: GenerateStreamsHandler = async (ctx) => {}

export default handler
