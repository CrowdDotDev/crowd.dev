import CronTime from 'cron-time-generator'

import { IS_DEV_ENV, IS_PROD_ENV, distinctBy, singleOrDefault } from '@crowd/common'
import { READ_DB_CONFIG, getDbConnection } from '@crowd/data-access-layer/src/database'
import {
  INangoIntegrationData,
  fetchNangoIntegrationData,
} from '@crowd/data-access-layer/src/integrations'
import { pgpQx } from '@crowd/data-access-layer/src/queryExecutor'
import {
  ALL_NANGO_INTEGRATIONS,
  NangoIntegration,
  SyncStatus,
  getNangoConnectionStatus,
  getNangoConnections,
  initNangoCloudClient,
  nangoIntegrationToPlatform,
} from '@crowd/nango'
import { PlatformType } from '@crowd/types'

import { IJobDefinition } from '../types'

const nangoEnv = IS_PROD_ENV ? 'prod' : IS_DEV_ENV ? 'local' : 'dev'

type NangoIntegrationDataExtended = INangoIntegrationData & { connectionId: string }

const job: IJobDefinition = {
  name: 'nango-monitor',
  cronTime: IS_DEV_ENV ? CronTime.everyMinute() : CronTime.everyDayAt(8, 0),
  timeout: 5 * 60,
  process: async (ctx) => {
    ctx.log.info('Running nango-monitor job...')

    await initNangoCloudClient()
    const dbConnection = await getDbConnection(READ_DB_CONFIG(), 3, 0)

    const allIntegrations = await fetchNangoIntegrationData(
      pgpQx(dbConnection),
      ALL_NANGO_INTEGRATIONS.map(nangoIntegrationToPlatform),
    )

    const nangoConnections = await getNangoConnections()

    const statusMap = new Map<NangoIntegrationDataExtended, SyncStatus[]>()

    for (const int of allIntegrations) {
      if (int.platform === PlatformType.GITHUB_NANGO) {
        for (const connectionId of Object.keys(int.settings.nangoMapping)) {
          const nangoConnection = singleOrDefault(
            nangoConnections,
            (c) => c.connection_id === connectionId,
          )
          if (!nangoConnection) {
            ctx.log.warn(
              `${int.platform} integration with id "${int.id}" is not connected to Nango!`,
            )
          } else {
            const results = await getNangoConnectionStatus(
              NangoIntegration.GITHUB,
              nangoConnection.connection_id,
            )

            statusMap.set(
              {
                ...int,
                connectionId,
              },
              results,
            )
          }
        }
      } else {
        const nangoConnection = singleOrDefault(nangoConnections, (c) => c.connection_id === int.id)
        if (!nangoConnection) {
          ctx.log.warn(`${int.platform} integration with id "${int.id}" is not connected to Nango!`)
        } else {
          const results = await getNangoConnectionStatus(
            int.platform as NangoIntegration,
            nangoConnection.connection_id,
          )

          statusMap.set(
            {
              ...int,
              connectionId: nangoConnection.connection_id,
            },
            results,
          )
        }
      }
    }

    ctx.log.info(
      `Found ${distinctBy(Array.from(statusMap.keys()), (k) => k.id).length} integrations that are mapped in nango cloud with ${statusMap.size} connections.`,
    )

    // logs with slackNotify: true will be published to slack #cm-alerts using datadog monitor
    let slackMessage = `Nango Monitor Results:\n`

    for (const nangoIntegration of ALL_NANGO_INTEGRATIONS) {
      const integrations = Array.from(statusMap.entries()).filter(
        (i) => i[0].platform === nangoIntegrationToPlatform(nangoIntegration),
      )

      if (integrations.length > 0) {
        let successfulSyncs = 0
        let failedSyncs = 0
        let runningSyncs = 0

        const failedConnections: NangoIntegrationDataExtended[] = []
        for (const [data, statuses] of integrations) {
          const failed = statuses.filter((s) => s.status === 'ERROR')
          successfulSyncs += statuses.filter((s) => s.status === 'SUCCESS').length
          failedSyncs += failed.length
          runningSyncs += statuses.filter((s) => s.status === 'RUNNING').length

          if (failed.length > 0) {
            failedConnections.push(data)
          }
        }

        slackMessage += `\n*${nangoIntegration}* on nango has ${distinctBy(integrations, (i) => i[0].id)} integrations mapped with ${integrations.length} connections and with ${successfulSyncs + failedSyncs + runningSyncs} total syncs:\n`
        if (successfulSyncs > 0) {
          slackMessage += `- ${successfulSyncs} successful syncs\n`
        }
        if (failedSyncs > 0) {
          slackMessage += `- ${failedSyncs} failed syncs\n`
        }
        if (runningSyncs > 0) {
          slackMessage += `- ${runningSyncs} currently running syncs\n`
        }

        if (failedConnections.length > 0) {
          slackMessage += `*Failed connections:*\n`
          for (const failed of failedConnections) {
            slackMessage += `  - <https://app.nango.dev/${nangoEnv}/connections/${failed.platform}/${failed.id}|Integration: ${failed.id}, Connection :${failed.connectionId}>`
          }
        }
      }
    }

    ctx.log.warn({ slackNotify: true }, slackMessage)
  },
}

export default job
