import { Client, Connection } from '@temporalio/client'

import { IS_DEV_ENV, SERVICE } from '@crowd/common'
import { getServiceChildLogger } from '@crowd/logging'

import { getDataConverter } from './encryption/data-converter'
import { EncryptionCodec } from './encryption/encryption-codec'

export interface ITemporalConfig {
  serverUrl: string
  namespace: string
  identity: string
  certificate?: string
  privateKey?: string
}

const log = getServiceChildLogger('temporal')

let config: ITemporalConfig | undefined = undefined
export const TEMPORAL_CONFIG = (): ITemporalConfig => {
  if (!config) {
    config = {
      serverUrl: process.env['CROWD_TEMPORAL_SERVER_URL'],
      namespace: process.env['CROWD_TEMPORAL_NAMESPACE'],
      identity: SERVICE,
      certificate: process.env['CROWD_TEMPORAL_CERTIFICATE'],
      privateKey: process.env['CROWD_TEMPORAL_PRIVATE_KEY'],
    }
  }

  return config
}

let client: Client | undefined
export const getTemporalClient = async (cfg: ITemporalConfig): Promise<Client> => {
  if (client) {
    return client
  }

  log.info(
    {
      serverUrl: cfg.serverUrl,
      namespace: cfg.namespace,
      identity: cfg.identity,
      certificate: cfg.certificate ? 'yes' : 'no',
      privateKey: cfg.privateKey ? 'yes' : 'no',
    },
    'Creating temporal client!',
  )
  const connection = await Connection.connect({
    address: cfg.serverUrl,
    tls:
      cfg.certificate && cfg.privateKey
        ? {
            clientCertPair: {
              crt: Buffer.from(cfg.certificate, 'base64'),
              key: Buffer.from(cfg.privateKey, 'base64'),
            },
          }
        : undefined,
  })

  client = new Client({
    connection,
    namespace: cfg.namespace,
    identity: cfg.identity,
    dataConverter: IS_DEV_ENV ? undefined : await getDataConverter(),
  })

  log.info(
    {
      serverUrl: cfg.serverUrl,
      namespace: cfg.namespace,
      identity: cfg.identity,
      certificate: cfg.certificate ? 'yes' : 'no',
      privateKey: cfg.privateKey ? 'yes' : 'no',
    },
    'Connected to temporal!',
  )

  return client
}

export { getDataConverter, EncryptionCodec }
export * from '@temporalio/client'
