import CronTime from 'cron-time-generator'

import { IS_DEV_ENV, singleOrDefault } from '@crowd/common'
import { READ_DB_CONFIG, getDbConnection } from '@crowd/data-access-layer/src/database'
import { fetchNangoIntegrationData } from '@crowd/data-access-layer/src/integrations'
import { pgpQx } from '@crowd/data-access-layer/src/queryExecutor'
import { ALL_NANGO_INTEGRATIONS, deleteNangoConnection, getNangoConnectionIds } from '@crowd/nango'

import { IJobDefinition } from '../types'

const job: IJobDefinition = {
  name: 'nango-connection-cleanup',
  cronTime: IS_DEV_ENV ? CronTime.every(10).minutes() : CronTime.every(7).days(),
  timeout: 15 * 60,
  enabled: async () => true,
  process: async (ctx) => {
    ctx.log.info('Cleaning up stale/old/unconnected nango integration connections!')

    const dbConnection = await getDbConnection(READ_DB_CONFIG(), 3, 0)

    const allIntegrations = await fetchNangoIntegrationData(
      pgpQx(dbConnection),
      ALL_NANGO_INTEGRATIONS,
    )

    const nangoConnections = await getNangoConnectionIds()

    for (const connection of nangoConnections) {
      const integration = singleOrDefault(allIntegrations, (i) => i.id === connection.connectionId)

      if (!integration) {
        // check if connection.created is older than 1 month
        const created = new Date(connection.createdAt)

        if (created < new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)) {
          ctx.log.info(`Deleting stale connection ${connection.connectionId}`)
          await deleteNangoConnection(connection.integration, connection.connectionId)
        }
      }
    }
  },
}

export default job
