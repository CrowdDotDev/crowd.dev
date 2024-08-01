import { Client } from '@opensearch-project/opensearch'
import { IOpenSearchConfig } from '@crowd/types'

export const getOpensearchClient = (config: IOpenSearchConfig) => {
  if (config.node) {
    if (config.username) {
      return new Client({
        node: config.node,
        auth: {
          username: config.username,
          password: config.password,
        },
        ssl: {
          rejectUnauthorized: false,
        },
        maxRetries: 5,
        requestTimeout: 60000,
        sniffOnStart: true,
        sniffInterval: 60000,
      })
    }
    return new Client({
      node: config.node,
    })
  }

  throw new Error('Missing node url while initializing opensearch!')
}
