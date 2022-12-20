import axios from 'axios'
import { PIZZLY_CONFIG } from '../../../../config'
import { Logger } from '../../../../utils/logging'

async function getToken(connectionId: string, providerConfigKey: string, logger: Logger) {
  try {
    const url = `${PIZZLY_CONFIG.url}/connection/${connectionId}`
    const secretKey = PIZZLY_CONFIG.secretKey
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Basic ${Buffer.from(`${secretKey}:`).toString('base64')}`,
    }

    const params = {
      provider_config_key: providerConfigKey,
    }

    const response = await axios.get(url, { params, headers })

    return response.data.credentials.accessToken
  } catch (err) {
    logger.error({ err }, 'Error while getting token from Pizzly')
    throw err
  }
}

export default getToken
