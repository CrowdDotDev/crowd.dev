import { Connection, Client } from '@temporalio/client'

export interface ITemporalConfig {
  serverUrl: string
  namespace: string
  identity: string
}

let client: Client | undefined
export const getTemporalClient = async (cfg: ITemporalConfig): Promise<Client> => {
  if (client) {
    return client
  }

  // TODO: Handle TLS for Temporal Cloud.
  const connection = await Connection.connect({
    address: cfg.serverUrl,
    // tls
  })

  client = new Client({
    connection,
    namespace: cfg.namespace,
    identity: cfg.identity,
  })

  return client
}

export * from '@temporalio/client'
