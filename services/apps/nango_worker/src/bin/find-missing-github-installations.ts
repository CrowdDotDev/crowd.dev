import { READ_DB_CONFIG, getDbConnection } from '@crowd/data-access-layer/src/database'
import { pgpQx } from '@crowd/data-access-layer/src/queryExecutor'
import { getServiceLogger } from '@crowd/logging'
import { NangoIntegration, getNangoConnections, initNangoCloudClient } from '@crowd/nango'

const log = getServiceLogger()

setImmediate(async () => {
  const db = await getDbConnection(READ_DB_CONFIG())
  const qx = pgpQx(db)

  await initNangoCloudClient()

  // Get all github-token-* connections from Nango
  const allConnections = await getNangoConnections()
  const tokenConnections = allConnections.filter(
    (c) =>
      c.provider_config_key === NangoIntegration.GITHUB &&
      c.connection_id.toLowerCase().startsWith('github-token-'),
  )

  log.info(`Found ${tokenConnections.length} github-token-* connections in Nango`)

  // Extract installation IDs from connection names (e.g., github-token-52165842 -> 52165842)
  const nangoInstallationIds = tokenConnections
    .map((c) => {
      const match = c.connection_id.match(/^github-token-(\d+)$/i)
      return match ? match[1] : null
    })
    .filter((id): id is string => id !== null)

  log.info(`Extracted ${nangoInstallationIds.length} installation IDs from Nango connections`)

  if (nangoInstallationIds.length > 0) {
    log.info(`Nango installation IDs: ${nangoInstallationIds.join(', ')}`)
  }

  // Find all GitHub integrations in the database that are NOT in Nango
  const missingInstallations = await qx.select(
    `
    SELECT
      id,
      "integrationIdentifier",
      "tenantId",
      "segmentId",
      status,
      "createdAt"
    FROM integrations
    WHERE platform = 'github'
      AND "deletedAt" IS NULL
      AND "integrationIdentifier" IS NOT NULL
      ${nangoInstallationIds.length > 0 ? `AND "integrationIdentifier" NOT IN ($(nangoInstallationIds:csv))` : ''}
    ORDER BY "createdAt" DESC
    `,
    { nangoInstallationIds },
  )

  log.info(
    `Found ${missingInstallations.length} GitHub installations in database that are NOT in Nango`,
  )

  if (missingInstallations.length > 0) {
    console.log('\n--- Missing GitHub Installations ---')
    console.log('These GitHub app installations exist in the database but not in Nango:\n')

    for (const installation of missingInstallations) {
      console.log(`Installation ID: ${installation.integrationIdentifier}`)
      console.log(`  Integration ID: ${installation.id}`)
      console.log(`  Tenant ID: ${installation.tenantId}`)
      console.log(`  Segment ID: ${installation.segmentId}`)
      console.log(`  Status: ${installation.status}`)
      console.log(`  Created At: ${installation.createdAt}`)
      console.log('')
    }

    console.log(`\nTotal missing: ${missingInstallations.length}`)
  } else {
    console.log('\nAll GitHub installations in the database are present in Nango.')
  }

  process.exit(0)
})
