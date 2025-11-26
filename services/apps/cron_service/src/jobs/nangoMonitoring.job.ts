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
  platformToNangoIntegration,
} from '@crowd/nango'
import { PlatformType } from '@crowd/types'

import { IJobDefinition } from '../types'

/* eslint-disable @typescript-eslint/no-explicit-any */

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

    const allIntegrations = await fetchNangoIntegrationData(pgpQx(dbConnection), [
      ...new Set(ALL_NANGO_INTEGRATIONS.map(nangoIntegrationToPlatform)),
    ])

    const nangoConnections = await getNangoConnections()

    const statusMap = new Map<NangoIntegrationDataExtended, SyncStatus[]>()

    const ghMissingNangoConnections: Map<string, string[]> = new Map()
    const ghNotConnectedToNangoYet: Map<string, number> = new Map()
    const ghNoCursorsYet: Map<string, number> = new Map()

    let totalRepos = 0

    for (const int of allIntegrations) {
      if (int.platform === PlatformType.GITHUB_NANGO) {
        // first go through all orgs and repos and check if they are connected to nango
        for (const org of int.settings.orgs) {
          const orgName = org.name
          for (const repo of org.repos) {
            const repoName = repo.name
            totalRepos++

            let found = false

            if (int.settings.nangoMapping) {
              for (const mapping of Object.values(int.settings.nangoMapping) as any[]) {
                if (mapping.owner === orgName && mapping.repoName === repoName) {
                  found = true
                }
              }
            }

            if (!found) {
              if (ghNotConnectedToNangoYet.has(int.id)) {
                ghNotConnectedToNangoYet.set(int.id, ghNotConnectedToNangoYet.get(int.id) + 1)
              } else {
                ghNotConnectedToNangoYet.set(int.id, 1)
              }
            }
          }
        }

        // then get nango connection statuses for each connection
        if (int.settings.nangoMapping) {
          for (const connectionId of Object.keys(int.settings.nangoMapping)) {
            // check if we have cursors already for this connection
            if (!int.settings.cursors || !int.settings.cursors[connectionId]) {
              if (ghNoCursorsYet.has(int.id)) {
                ghNoCursorsYet.set(int.id, ghNoCursorsYet.get(int.id) + 1)
              } else {
                ghNoCursorsYet.set(int.id, 1)
              }
            }

            const nangoConnection = singleOrDefault(
              nangoConnections,
              (c) => c.connection_id === connectionId,
            )
            if (nangoConnection) {
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
            } else {
              // repo not connected to nango anymore!
              if (ghMissingNangoConnections.has(int.id)) {
                ghMissingNangoConnections.get(int.id).push(connectionId)
              } else {
                ghMissingNangoConnections.set(int.id, [connectionId])
              }
            }
          }
        }
      } else {
        const nangoConnection = singleOrDefault(nangoConnections, (c) => c.connection_id === int.id)
        if (!nangoConnection) {
          ctx.log.warn(`${int.platform} integration with id "${int.id}" is not connected to Nango!`)
        } else {
          const results = await getNangoConnectionStatus(
            platformToNangoIntegration(int.platform as PlatformType, int.settings),
            nangoConnection.connection_id,
          )
          if (!results)
            // connection not found
            continue
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

        slackMessage += `\n*${nangoIntegration}* has ${distinctBy(integrations, (i) => i[0].id).length} integrations with ${integrations.length} connections and ${successfulSyncs + failedSyncs + runningSyncs} syncs`
        const syncMessages: string[] = []
        if (successfulSyncs > 0) {
          syncMessages.push(`${successfulSyncs} successful syncs`)
        }
        if (failedSyncs > 0) {
          syncMessages.push(`${failedSyncs} failed syncs`)
        }
        if (runningSyncs > 0) {
          syncMessages.push(`${runningSyncs} running syncs`)
        }

        if (syncMessages.length > 0) {
          slackMessage += ` (${syncMessages.join(', ')})\n`
        } else {
          slackMessage += `\n`
        }

        if (nangoIntegration === NangoIntegration.GITHUB) {
          if (ghMissingNangoConnections.size > 0) {
            for (const [integrationId, connectionIds] of ghMissingNangoConnections.entries()) {
              slackMessage += `- *${integrationId}* has ${connectionIds.length} missing nango connections (${connectionIds.join(',')})\n`
            }
          }

          if (ghNotConnectedToNangoYet.size > 0) {
            let totalNotConnected = 0
            for (const count of Array.from(ghNotConnectedToNangoYet.values())) {
              totalNotConnected += count
            }

            slackMessage += `We have in total ${totalRepos} repos and ${totalNotConnected} of them are not connected to nango yet!\n`
          }

          if (ghNoCursorsYet.size > 0) {
            slackMessage += `And ${ghNoCursorsYet.size} of them have no cursors yet!\n`
          }
        }

        if (failedConnections.length > 0) {
          slackMessage += `*Failed connections:* ${failedConnections.map((failed) => `<https://app.nango.dev/${nangoEnv}/connections/${platformToNangoIntegration(failed.platform as PlatformType, failed.settings)}/${failed.connectionId}|${failed.connectionId}>`).join(',')}`
        }
      }
    }

    ctx.log.warn({ slackNangoNotify: true }, slackMessage)
  },
}

export default job
