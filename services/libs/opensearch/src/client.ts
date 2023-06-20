import { Client } from '@opensearch-project/opensearch'
import { AwsSigv4Signer } from '@opensearch-project/opensearch/aws'
import { IOpenSearchConfig } from '@crowd/types'

export const getOpensearchClient = (config: IOpenSearchConfig) => {
  if (config.node) {
    if (config.region && config.accessKeyId && config.secretAccessKey) {
      return new Client({
        node: config.node,
        ...AwsSigv4Signer({
          region: config.region,
          service: 'es',
          getCredentials: async () => ({
            accessKeyId: config.accessKeyId,
            secretAccessKey: config.secretAccessKey,
          }),
        }),
      })
    }
    return new Client({
      node: config.node,
    })
  }

  throw new Error('Missing node url while initializing opensearch!')
}
