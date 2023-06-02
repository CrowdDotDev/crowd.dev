import axios from 'axios'
import { Logger } from '@crowd/logging'
import { NANGO_CONFIG } from '../../../../conf'

async function getToken(connectionId: string, providerConfigKey: string, logger: Logger) {
  try {
    const url = `${NANGO_CONFIG.url}/connection/${connectionId}`
    const secretKey = NANGO_CONFIG.secretKey
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Basic ${Buffer.from(`${secretKey}:`).toString('base64')}`,
    }

    logger.debug({ secretKey, connectionId, providerConfigKey }, 'Fetching Nango token!')

    const params = {
      provider_config_key: providerConfigKey,
    }

    const response = await axios.get(url, { params, headers })

    return response.data.credentials.access_token
  } catch (err) {
    logger.error({ err }, 'Error while getting token from Nango')
    throw err
  }
}

export default getToken
