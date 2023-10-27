import { Connection, Client } from '@temporalio/client'

export interface ITemporalConfig {
  serverUrl: string
  namespace: string
  identity: string
  rootCa?: string
  certificate?: string
  privateKey?: string
}

let client: Client | undefined
export const getTemporalClient = async (cfg: ITemporalConfig): Promise<Client> => {
  if (client) {
    return client
  }

  const connection = await Connection.connect({
    address: cfg.serverUrl,
    tls:
      cfg.rootCa && cfg.certificate && cfg.privateKey
        ? {
            serverRootCACertificate: Buffer.from(cfg.rootCa, 'base64'),
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
