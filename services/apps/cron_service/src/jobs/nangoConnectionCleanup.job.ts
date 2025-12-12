import CronTime from 'cron-time-generator'

import { IS_DEV_ENV, IS_STAGING_ENV, singleOrDefault } from '@crowd/common'
import { READ_DB_CONFIG, getDbConnection } from '@crowd/data-access-layer/src/database'
import {
  INangoIntegrationData,
  fetchNangoDeIntegrationData,
  fetchNangoIntegrationData,
} from '@crowd/data-access-layer/src/integrations'
import { pgpQx } from '@crowd/data-access-layer/src/queryExecutor'
import {
  ALL_NANGO_INTEGRATIONS,
  NangoIntegration,
  deleteNangoConnection,
  getNangoConnections,
  initNangoCloudClient,
  nangoIntegrationToPlatform,
} from '@crowd/nango'
import { PlatformType } from '@crowd/types'

import { IJobDefinition } from '../types'

const job: IJobDefinition = {
  name: 'nango-connection-cleanup',
  cronTime: IS_DEV_ENV || IS_STAGING_ENV ? CronTime.every(10).minutes() : CronTime.everyDay(),
  timeout: 15 * 60,
  enabled: async () => IS_DEV_ENV || IS_STAGING_ENV,
  process: async (ctx) => {
    ctx.log.info('Cleaning up stale/old/unconnected nango integration connections!')

    await initNangoCloudClient()
    const dbConnection = await getDbConnection(READ_DB_CONFIG(), 3, 0)
    const qx = pgpQx(dbConnection)

    // Fetch all active integrations
    const activeIntegrations = await fetchNangoIntegrationData(qx, [
      ...new Set(ALL_NANGO_INTEGRATIONS.map(nangoIntegrationToPlatform)),
    ])

    // Fetch deleted integrations to clean up their connections
    const deletedIntegrations = await fetchNangoDeIntegrationData(qx, [
      ...new Set(ALL_NANGO_INTEGRATIONS.map(nangoIntegrationToPlatform)),
    ])

    // Build a set of deleted integration IDs for quick lookup
    const deletedIntegrationIds = new Set(deletedIntegrations.map((i) => i.id))
    // Combine for lookup purposes
    const allIntegrations = [...activeIntegrations, ...deletedIntegrations]

    const nangoConnections = await getNangoConnections()

    for (const connection of nangoConnections.filter((c) =>
      ALL_NANGO_INTEGRATIONS.includes(c.provider_config_key as NangoIntegration),
    )) {
      // ignore github token connections
      if (connection.connection_id.toLowerCase().startsWith('github-token-')) {
        continue
      }

      let integration: INangoIntegrationData | undefined

      // github integrations have connection ids per repo in the settings nangoMapping object
      if (connection.provider_config_key === NangoIntegration.GITHUB) {
        integration = singleOrDefault(allIntegrations, (i) => {
          if (i.platform !== PlatformType.GITHUB_NANGO) {
            return false
          }

          if (i.settings.nangoMapping && i.settings.nangoMapping[connection.connection_id]) {
            return true
          }

          return false
        })
        // for other integrations, check if the connection belongs to an integration
      } else {
        integration = singleOrDefault(allIntegrations, (i) => i.id === connection.connection_id)
      }

      const integrationCreatedAt = new Date(connection.created)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

      const shouldDelete =
        integrationCreatedAt < thirtyDaysAgo &&
        // If connection doesn't belong to any integration, delete after 30 days
        (!integration ||
          // If connection belongs to a deleted integration, delete after 30 days
          (integration && deletedIntegrationIds.has(integration?.id)))

      if (shouldDelete) {
        ctx.log.info(`Deleting stale connection ${connection.connection_id}`)
        await deleteNangoConnection(
          connection.provider_config_key as NangoIntegration,
          connection.connection_id,
        )
      }
    }
  },
}

export default job
