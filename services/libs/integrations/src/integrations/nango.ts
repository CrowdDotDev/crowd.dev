import { IProcessStreamContext, IGenerateStreamsContext } from '../types'
import axios from 'axios'

export const getNangoToken = async (
  connectionId: string,
  providerConfigKey: string,
  ctx: IProcessStreamContext | IGenerateStreamsContext,
): Promise<string> => {
  try {
    const url = `${ctx.serviceSettings.nangoUrl}/connection/${connectionId}`
    const secretKey = ctx.serviceSettings.nangoSecretKey
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Basic ${Buffer.from(`${secretKey}:`).toString('base64')}`,
    }

    ctx.log.debug({ secretKey, connectionId, providerConfigKey }, 'Fetching Nango token!')

    const params = {
      provider_config_key: providerConfigKey,
    }

    const response = await axios.get(url, { params, headers })

    return response.data.credentials.access_token
  } catch (err) {
    ctx.log.error({ err }, 'Error while getting token from Nango')
    throw err
  }
}
