import { DbConnection, getDbConnection } from '@crowd/data-access-layer/src/database'
import { getServiceLogger } from '@crowd/logging'
import { DB_CONFIG } from '../conf'

import { websiteNormalizer } from '@crowd/common'

/* eslint-disable @typescript-eslint/no-explicit-any */

const log = getServiceLogger()

async function getOrgsWithWrongWebsite(db: DbConnection, options: { countOnly?: boolean }) {
  if (options.countOnly) {
    const result = await db.one(`
      SELECT COUNT(*)
      FROM "organizationIdentities"
      WHERE type = 'WEBSITE'
      AND value NOT LIKE '%www%';
    `)

    return result.count
  }

  const result = await db.any(`
   SELECT *
    FROM "organizationIdentities"
    WHERE value LIKE '%www%' limit 100;
  `)

  return result
}

async function updateOrgWebsite(db: DbConnection, orgId: string, website: string) {
  await db.none(
    `
        UPDATE "organizationIdentities"
        SET value = $(website)
        WHERE "organizationId" = $(orgId)
        AND platform = 'github'
    `,
    { orgId, website },
  )
}

async function findOrgByIdentityAndPlatform(db: DbConnection, identity: string, platform: string) {
  const result = await db.any(
    `
        SELECT *
        FROM "organizationIdentities"
        WHERE value = $(identity)
        AND platform = $(platform)
      `,
    { identity, platform },
  )

  return result
}

setImmediate(async () => {
  const dbClient = await getDbConnection(DB_CONFIG())

  log.info('Started fixing organizations identities!')

  let processedOrgs = 0

  const totalWrongOrgs = await getOrgsWithWrongWebsite(dbClient, { countOnly: true })

  if (totalWrongOrgs == 0) {
    log.info('No orgs with incorrect identities found!')
    process.exit(0)
  }

  log.info(`Found ${totalWrongOrgs} orgs!`)

  while (processedOrgs < totalWrongOrgs) {
    const orgs = await getOrgsWithWrongWebsite(dbClient, {})
    for (const org of orgs) {
      const website = websiteNormalizer(org.value)
      const existingOrg = await findOrgByIdentityAndPlatform(dbClient, website, 'github')

      // If the normalized website belongs to a different org, skip the update
      if (existingOrg.length > 0 && existingOrg[0].organizationId !== org.organizationId) {
        log.warn(
          `Website ${website} already belongs to org ${existingOrg[0].organizationId}, skipping!`,
        )
        continue
      }

      await updateOrgWebsite(dbClient, org.organizationId, website)

      processedOrgs++

      log.info(`processed ${processedOrgs}/${totalWrongOrgs} orgs`)
    }
  }

  log.info('Finished fixing members with incorrect displayName!')

  process.exit(0)
})
