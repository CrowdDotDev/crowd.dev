import { READ_DB_CONFIG, getDbConnection } from '@crowd/data-access-layer/src/database'
import { fetchNangoIntegrationData } from '@crowd/data-access-layer/src/integrations'
import { pgpQx } from '@crowd/data-access-layer/src/queryExecutor'
import { getServiceLogger } from '@crowd/logging'
import { PlatformType } from '@crowd/types'

const log = getServiceLogger()

setImmediate(async () => {
  const db = await getDbConnection(READ_DB_CONFIG())

  const integrations = await fetchNangoIntegrationData(pgpQx(db), [PlatformType.GITHUB_NANGO])

  let totalRepos = 0
  let connectedRepos = 0
  let missingConnectionCount = 0
  let totalConnectionIds = 0
  let connectionIdsWithoutCursor = 0

  for (const integration of integrations) {
    // Track connectionIds that don't have cursors
    if (integration.settings?.nangoMapping) {
      const connectionIds = Object.keys(integration.settings.nangoMapping)
      totalConnectionIds += connectionIds.length

      for (const connectionId of connectionIds) {
        if (!integration.settings.cursors || !integration.settings.cursors[connectionId]) {
          log.warn(
            `NO CURSOR: integration "${integration.id}", connectionId "${connectionId}" (${integration.settings.nangoMapping[connectionId].owner}/${integration.settings.nangoMapping[connectionId].repoName})`,
          )
          connectionIdsWithoutCursor++
        }
      }
    }

    // Loop through orgs in settings
    if (integration.settings?.orgs) {
      for (const org of integration.settings.orgs) {
        // Loop through repos in each org
        if (org.repos) {
          for (const repo of org.repos) {
            totalRepos++

            if (!integration.settings.nangoMapping) {
              log.warn(
                `NO NANGO MAPPING: integration "${integration.id}", org "${org.name}", repo "${repo.name}"`,
              )
              missingConnectionCount++
              continue
            }

            let found = false
            for (const connectionId of Object.keys(integration.settings.nangoMapping)) {
              const mapping = integration.settings.nangoMapping[connectionId]
              if (mapping.owner === org.name && mapping.repoName === repo.name) {
                found = true
                break
              }
            }

            if (!found) {
              log.warn(
                `NO CONNECTION: integration "${integration.id}", org "${org.name}", repo "${repo.name}"`,
              )
              missingConnectionCount++
            } else {
              connectedRepos++
            }
          }
        }
      }
    }
  }

  log.info('='.repeat(60))
  log.info('SUMMARY:')
  log.info(`Total repositories: ${totalRepos}`)
  log.info(`Connected repositories (with mapping): ${connectedRepos}`)
  log.info(`Repositories with missing connection: ${missingConnectionCount}`)
  log.info('')
  log.info(`Total connectionIds in nangoMapping: ${totalConnectionIds}`)
  log.info(`ConnectionIds without cursor: ${connectionIdsWithoutCursor}`)
  log.info(`ConnectionIds with cursor: ${totalConnectionIds - connectionIdsWithoutCursor}`)
  log.info('='.repeat(60))

  process.exit(0)
})
