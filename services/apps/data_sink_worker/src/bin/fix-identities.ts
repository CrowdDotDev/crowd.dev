import { DbTransaction, getDbConnection } from '@crowd/data-access-layer/src/database'
import { getServiceLogger } from '@crowd/logging'
import { parse } from 'csv-parse/sync'
import fs from 'fs'
import { DB_CONFIG } from '../conf'
import { OrganizationIdentityType } from '@crowd/types'

const log = getServiceLogger()

const stats = new Map<string, number>()

setImmediate(async () => {
  log.info('Loading data from csv file...')
  const data = await fs.readFileSync('data.csv', 'utf8')
  const records = parse(data, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    delimiter: ',',
  })

  const dbConnection = await getDbConnection(DB_CONFIG())

  for (const record of records) {
    const accountName = record['ACCOUNT_NAME']
    log.info({ accountName }, 'Processing record...')

    await dbConnection.tx(async (conn) => {
      const organizationId = await findOrganizationId(conn, accountName)

      if (organizationId) {
        log.info({ accountName, organizationId }, 'Organization found!')
        stats.set(Stat.ORG_FOUND, (stats.get(Stat.ORG_FOUND) || 0) + 1)

        const orgData = await getOrganizationData(conn, organizationId)

        if (orgData.displayName.trim() !== accountName) {
          stats.set(Stat.ORG_NAME_UPDATED, (stats.get(Stat.ORG_NAME_UPDATED) || 0) + 1)
        }

        const domain = record['ACCOUNT_DOMAIN']
        if (domain) {
          // only use this domain as primary identity and set the others to be alternative
          const existing = orgData.identities.find(
            (i) =>
              i.type === OrganizationIdentityType.PRIMARY_DOMAIN &&
              i.verified &&
              i.value.trim() === domain.trim(),
          )

          if (!existing) {
            stats.set(
              Stat.ORG_PRIMARY_DOMAIN_NOT_FOUND,
              (stats.get(Stat.ORG_PRIMARY_DOMAIN_NOT_FOUND) || 0) + 1,
            )
          } else {
            const otherPrimaryDomainIdentities = orgData.identities.filter(
              (i) =>
                i.type === OrganizationIdentityType.PRIMARY_DOMAIN &&
                i.value.trim() !== domain.trim(),
            )

            // remove identity from db because alternative domain one already exists
            const toRemove: OrgIdentity[] = []
            // move identity to be alternative domain identity
            const toMove: OrgIdentity[] = []
            // update alternative domain identity to be verified instead
            const toUpdate: OrgIdentity[] = []

            for (const identity of otherPrimaryDomainIdentities) {
              const alternative = orgData.identities.find(
                (i) =>
                  i.type === OrganizationIdentityType.ALTERNATIVE_DOMAIN &&
                  i.value.trim() === identity.value.trim(),
              )
              if (alternative) {
                if (!alternative.verified && identity.verified) {
                  stats.set(
                    Stat.ORG_IDENTITY_UPDATED,
                    (stats.get(Stat.ORG_IDENTITY_UPDATED) || 0) + 1,
                  )
                  toUpdate.push(identity)
                } else {
                  stats.set(
                    Stat.ORG_IDENTITY_REMOVED,
                    (stats.get(Stat.ORG_PRIMARY_DOMAIN_NOT_FOUND) || 0) + 1,
                  )
                  toRemove.push(identity)
                }
              } else {
                stats.set(
                  Stat.ORG_IDENTITY_MOVED,
                  (stats.get(Stat.ORG_PRIMARY_DOMAIN_NOT_FOUND) || 0) + 1,
                )
                toMove.push(identity)
              }
            }
          }
        }

        const logo = record['LOGO_URL']
        if (logo && (!orgData.logo || orgData.logo.trim() !== logo.trim())) {
          // update the logo url
          stats.set(Stat.ORG_LOGO_UPDATED, (stats.get(Stat.ORG_LOGO_UPDATED) || 0) + 1)
        }
      } else {
        log.warn({ accountName }, 'Organization not found!')
        stats.set(Stat.ORG_NOT_FOUND, (stats.get(Stat.ORG_FOUND) || 0) + 1)
      }
    })
  }

  for (const [stat, count] of stats) {
    log.info({ stat, count }, 'Summary')
  }

  process.exit(0)
})

const getOrganizationData = async (
  conn: DbTransaction,
  organizationId: string,
): Promise<OrgData> => {
  const results = await Promise.all([
    conn.one(`select id, "displayName", logo from organizations where id = $(organizationId)`, {
      organizationId,
    }),
    conn.any(
      `select type, value, platform, verified from "organizationIdentities" where "organizationId" = $(organizationId)`,
      { organizationId },
    ),
  ])

  const [org, identities] = results

  return {
    id: org.id,
    displayName: org.displayName,
    identities,
  }
}

const findOrganizationId = async (
  conn: DbTransaction,
  accountName: string,
): Promise<string | null> => {
  const query = `
    select "organizationId"
    from "lfxMemberships"
    where "accountName" = $(accountName)
    limit 1
  `

  const result = await conn.oneOrNone(query, { accountName })

  if (!result) {
    return null
  }

  return result.organizationId
}

enum Stat {
  ORG_FOUND = 'ORG_FOUND',
  ORG_NOT_FOUND = 'ORG_NOT_FOUND',

  ORG_NAME_UPDATED = 'ORG_NAME_UPDATED',
  ORG_PRIMARY_DOMAIN_NOT_FOUND = 'ORG_PRIMARY_DOMAIN_NOT_FOUND',
  ORG_IDENTITY_MOVED = 'ORG_IDENTITY_MOVED',
  ORG_IDENTITY_UPDATED = 'ORG_IDENTITY_UPDATED',
  ORG_IDENTITY_REMOVED = 'ORG_IDENTITY_REMOVED',
  ORG_LOGO_UPDATED = 'ORG_LOGO_UPDATED',
}

interface OrgIdentity {
  type: OrganizationIdentityType
  value: string
  platform: string
  verified: boolean
}
interface OrgData {
  id: string
  logo: string
  displayName: string
  identities: OrgIdentity[]
}
