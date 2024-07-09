import { DbConnection, getDbConnection } from '@crowd/data-access-layer/src/database'
import { getServiceLogger } from '@crowd/logging'
import { DB_CONFIG } from '../conf'

import { websiteNormalizer } from '@crowd/common'

/* eslint-disable @typescript-eslint/no-explicit-any */

const log = getServiceLogger()

async function getOrgsWithWrongWebsite(
  db: DbConnection,
  tenantId: string,
  options: { countOnly?: boolean },
) {
  if (options.countOnly) {
    const result = await db.one(
      `
      SELECT COUNT(*)
      FROM "organizationIdentities"
      WHERE value LIKE '%www%' AND (type = 'alternative-domain' OR type = 'primary-domain') AND "tenantId" = $(tenantId);
    `,
      {
        tenantId,
      },
    )

    return result.count
  }

  const result = await db.any(
    `
   SELECT *
    FROM "organizationIdentities"
    WHERE value LIKE '%www%' AND (type = 'alternative-domain' OR type = 'primary-domain')
    AND "tenantId" = $(tenantId) LIMIT 100;
  `,
    {
      tenantId,
    },
  )

  return result
}

async function updateOrgIdentity(
  db: DbConnection,
  orgId: string,
  website: string,
  platform: string,
  type: string,
  verified: boolean,
  tenantId: string,
) {
  await db.none(
    `
        UPDATE "organizationIdentities"
        SET value = $(website)
        WHERE "organizationId" = $(orgId)
        AND platform = $(platform)
        AND type = $(type)
        AND verified = $(verified)
        AND "tenantId" = $(tenantId);
    `,
    { orgId, website, platform, type, verified, tenantId },
  )
}

async function findExistingIdentity(
  db: DbConnection,
  value: string,
  platform: string,
  type: string,
  verified: boolean,
  tenantId: string,
) {
  const result = await db.any(
    `
        SELECT *
        FROM "organizationIdentities"
        WHERE value = $(value)
        AND platform = $(platform)
        AND type = $(type)
        AND verified = $(verified)
        AND "tenantId" = $(tenantId);
      `,
    { value, platform, type, verified, tenantId },
  )

  return result
}

async function updateActivitiesOrgId(
  db: DbConnection,
  originalId: string,
  toUpdateId: string,
  tenantId: string,
) {
  await db.none(
    `
        UPDATE "activities"
        SET "organizationId" = $(toUpdateId)
        WHERE "organizationId" = $(originalId)
        AND "tenantId" = $(tenantId);
    `,
    { originalId, toUpdateId, tenantId },
  )
}

async function deleteOrgIdentity(
  db: DbConnection,
  orgId: string,
  platform: string,
  type: string,
  value: string,
  verified: boolean,
  tenantId: string,
) {
  await db.none(
    `
        DELETE FROM "organizationIdentities"
        WHERE "organizationId" = $(orgId)
        AND platform = $(platform)
        AND type = $(type)
        AND value = $(value)
        AND verified = $(verified)
        AND "tenantId" = $(tenantId);
    `,
    { orgId, platform, type, value, verified, tenantId },
  )
}

const processArguments = process.argv.slice(2)

if (processArguments.length !== 1) {
  log.error('Expected 1 argument: tenantId')
  process.exit(1)
}

const tenantId = processArguments[0]

setImmediate(async () => {
  const dbClient = await getDbConnection(DB_CONFIG())

  log.info('Started fixing organizations identities!')

  let processedOrgs = 0

  const totalWrongOrgs = await getOrgsWithWrongWebsite(dbClient, tenantId, { countOnly: true })

  if (totalWrongOrgs == 0) {
    log.info('No orgs with incorrect identities found!')
    process.exit(0)
  }

  log.info(`Found ${totalWrongOrgs} orgs!`)

  while (processedOrgs < totalWrongOrgs) {
    const orgs = await getOrgsWithWrongWebsite(dbClient, tenantId, {})
    for (const org of orgs) {
      const website = websiteNormalizer(org.value)
      const existingOrg = await findExistingIdentity(
        dbClient,
        website,
        org.platform,
        org.type,
        org.verified,
        tenantId,
      )

      if (existingOrg.length > 0) {
        const toUpdateId = existingOrg[0].organizationId
        // Ensure it's not the same organization
        if (toUpdateId !== org.organizationId) {
          log.info(
            `Organization with website ${website} already exists! Moving activities from ${org.organizationId} to ${toUpdateId}`,
          )
          await updateActivitiesOrgId(dbClient, org.organizationId, toUpdateId, tenantId)
          await deleteOrgIdentity(
            dbClient,
            org.organizationId,
            org.platform,
            org.type,
            org.value,
            org.verified,
            tenantId,
          )
        } else {
          log.info(`Deleting duplicate identity for organization ${org.organizationId}`)
          await deleteOrgIdentity(
            dbClient,
            org.organizationId,
            org.platform,
            org.type,
            org.value,
            org.verified,
            tenantId,
          )
        }
      } else {
        await updateOrgIdentity(
          dbClient,
          org.organizationId,
          website,
          org.platform,
          org.type,
          org.verified,
          tenantId,
        )
      }

      processedOrgs++

      log.info(`Processed ${processedOrgs}/${totalWrongOrgs} orgs`)
    }
  }

  log.info('Finished fixing members with incorrect displayName!')

  process.exit(0)
})
