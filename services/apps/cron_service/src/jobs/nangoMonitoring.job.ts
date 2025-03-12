import CronTime from 'cron-time-generator'

import { IS_CLOUD_ENV, IS_DEV_ENV, IS_PROD_ENV, singleOrDefault } from '@crowd/common'
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
  getNangoConnectionIds,
  getNangoConnectionStatus,
  initNangoCloudClient,
} from '@crowd/nango'

import { IJobDefinition } from '../types'

const nangoEnv = IS_PROD_ENV ? 'prod' : IS_DEV_ENV ? 'local' : 'dev'

const job: IJobDefinition = {
  name: 'nango-monitor',
  cronTime: IS_DEV_ENV ? CronTime.everyMinute() : CronTime.everyDayAt(8, 0),
  timeout: 5 * 60,
  enabled: async () => IS_CLOUD_ENV,
  process: async (ctx) => {
    ctx.log.info('Running nango-monitor job...')

    await initNangoCloudClient()
    const dbConnection = await getDbConnection(READ_DB_CONFIG(), 3, 0)

    const allIntegrations = await fetchNangoIntegrationData(
      pgpQx(dbConnection),
      ALL_NANGO_INTEGRATIONS,
    )

    const nangoConnections = await getNangoConnectionIds()

    const disconnectedIntegrations: INangoIntegrationData[] = []
    const statusMap = new Map<INangoIntegrationData, SyncStatus[]>()

    for (const int of allIntegrations) {
      const nangoConnection = singleOrDefault(nangoConnections, (c) => c.connectionId === int.id)
      if (!nangoConnection) {
        ctx.log.warn(`${int.platform} integration with id "${int.id}" is not connected to Nango!`)
        disconnectedIntegrations.push(int)
      } else {
        const results = await getNangoConnectionStatus(
          int.platform as NangoIntegration,
          nangoConnection.connectionId,
        )

        statusMap.set(int, results)
      }
    }

    ctx.log.info(`Found ${statusMap.size} integrations that are mapped in nango cloud.`)

    // logs with slackNotify: true will be published to slack #cm-alerts using datadog monitor
    let slackMessage = `Nango Monitor Results:\n`

    for (const nangoIntegration of ALL_NANGO_INTEGRATIONS) {
      const integrations = Array.from(statusMap.entries()).filter(
        (i) => i[0].platform === nangoIntegration,
      )

      if (integrations.length > 0) {
        let successfulSyncs = 0
        let failedSyncs = 0
        let runningSyncs = 0

        const failedIntegrations: INangoIntegrationData[] = []
        for (const [data, statuses] of integrations) {
          const failed = statuses.filter((s) => s.status === 'ERROR')
          successfulSyncs += statuses.filter((s) => s.status === 'SUCCESS').length
          failedSyncs += failed.length
          runningSyncs += statuses.filter((s) => s.status === 'RUNNING').length

          if (failed.length > 0) {
            failedIntegrations.push(data)
          }
        }

        slackMessage += `\n${nangoIntegration} on nango has ${integrations.length} integrations mapped with ${successfulSyncs} successful syncs, ${failedSyncs} failed syncs, and ${runningSyncs} currently running syncs.\n`
        if (failedIntegrations.length > 0) {
          slackMessage += `*Failed Integrations:*\n`
          for (const failed of failedIntegrations) {
            slackMessage += `  - <https://app.nango.dev/${nangoEnv}/connections/${failed.platform}/${failed.id}|${failed.id}>`
          }
        }
      }
    }

    ctx.log.warn({ slackNotify: true }, slackMessage)
  },
}

export default job
