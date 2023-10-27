import { getServiceChildLogger } from '@crowd/logging'
import { Connection, Client } from '@temporalio/client'

export interface ITemporalConfig {
  serverUrl: string
  namespace: string
  identity: string
  certificate?: string
  privateKey?: string
}

const log = getServiceChildLogger('temporal')

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
      certificate: cfg.certificate
        ? Buffer.from(cfg.certificate, 'base64').toString('ascii')
        : 'none',
      privateKey: cfg.privateKey ? Buffer.from(cfg.privateKey, 'base64').toString('ascii') : 'none',
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
  })

  return client
}

export * from '@temporalio/client'
