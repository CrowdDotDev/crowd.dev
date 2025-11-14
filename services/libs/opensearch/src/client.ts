import { Client } from '@opensearch-project/opensearch'

import { getServiceChildLogger } from '@crowd/logging'
import { IOpenSearchConfig } from '@crowd/types'

const log = getServiceChildLogger('opensearch.connection')

export const getOpensearchClient = async (config: IOpenSearchConfig): Promise<Client> => {
  let client: Client | undefined

  log.info({ node: config.node }, 'Connecting to OpenSearch!')

  if (config.node) {
    if (config.username) {
      client = new Client({
        node: config.node,
        auth: {
          username: config.username,
          password: config.password,
        },
        ssl: {
          rejectUnauthorized: false,
        },
        maxRetries: 3,
        requestTimeout: 30000,
        resurrectStrategy: 'ping',
        pingTimeout: 3000,
        suggestCompression: true,
        compression: 'gzip',
        name: 'opensearch-client',
      })
    } else {
      client = new Client({
        node: config.node,
      })
    }
  }

  if (!client) {
    throw new Error('Missing node url while initializing opensearch!')
  }

  await client.ping()
  log.info({ node: config.node }, 'Connected to OpenSearch!')

  return client
}
