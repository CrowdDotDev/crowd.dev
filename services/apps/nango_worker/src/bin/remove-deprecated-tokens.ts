import { getServiceLogger } from '@crowd/logging'
import {
  NangoIntegration,
  deleteNangoConnection,
  getNangoConnectionData,
  getNangoConnections,
  initNangoCloudClient,
  setNangoMetadata,
} from '@crowd/nango'

const log = getServiceLogger()

const tokenConnectionsToRemove = (process.env.TOKEN_CONNECTIONS_TO_REMOVE ?? '')
  .split(',')
  .filter((c) => c.trim().length !== 0)

if (tokenConnectionsToRemove.length === 0) {
  log.error('No token connections to remove')
  process.exit(1)
}

setImmediate(async () => {
  await initNangoCloudClient()

  for (const tokenConnection of tokenConnectionsToRemove) {
    log.info(`Removing token connection ${tokenConnection}`)
    try {
      const data = await getNangoConnectionData(NangoIntegration.GITHUB, tokenConnection)
      if (data) {
        await deleteNangoConnection(NangoIntegration.GITHUB, tokenConnection)
      }
    } catch (err) {
      if (err.status === 404) {
        log.info(`Token connection ${tokenConnection} not found!`)
        continue
      } else {
        throw err
      }
    }
  }

  const allConnections = await getNangoConnections()
  const githubConnections = allConnections.filter(
    (c) =>
      c.provider_config_key === NangoIntegration.GITHUB &&
      !c.connection_id.startsWith('github-token-'),
  )

  for (let i = 0; i < githubConnections.length; i++) {
    const githubConnection = githubConnections[i]
    log.info(
      `Processing connection ${githubConnection.connection_id} (${i + 1} of ${githubConnections.length})!`,
    )

    const data = await getNangoConnectionData(
      NangoIntegration.GITHUB,
      githubConnection.connection_id,
    )

    const metadata = data.metadata
    const existingConnectionIds = metadata.connection_ids as string[]
    for (const connectionId of existingConnectionIds) {
      if (tokenConnectionsToRemove.includes(connectionId)) {
        log.info(`Modifying metadata for connection ${githubConnection.connection_id}!`)

        const newMetadata = {
          ...metadata,
          connection_ids: (metadata.connection_ids as string[]).filter(
            (c) => !tokenConnectionsToRemove.includes(c),
          ),
        }

        await setNangoMetadata(NangoIntegration.GITHUB, githubConnection.connection_id, newMetadata)
      }
    }
  }

  process.exit(0)
})
