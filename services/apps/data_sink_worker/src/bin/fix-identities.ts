import { DbTransaction, getDbConnection } from '@crowd/data-access-layer/src/database'
import { getServiceLogger } from '@crowd/logging'
import { parse } from 'csv-parse/sync'
import fs from 'fs'
import { DB_CONFIG } from '../conf'
import { OrganizationIdentityType } from '@crowd/types'

/* eslint-disable @typescript-eslint/no-explicit-any */

const log = getServiceLogger()

const stats = new Map<string, number>()
const domainToNameMap = new Map<string, string>([
  ['mit.edu', 'Massachusetts Institute of Technology'],
  ['shell.com', 'Shell International Exploration & Production, Inc.'],
  ['allianz.com', 'Allianz Group'],
  ['tencent.com', 'Tencent Technology (Shenzhen) Co., Ltd.'],
  ['alibaba-inc.com', 'ALIBABA.COM, INC.'],
  ['ibm.com', 'International Business Machines Corporation'],
])
const nameToLogoMap = new Map<string, string>([
  [
    'Massachusetts Institute of Technology',
    'https://lf-master-organization-logos-prod.s3.us-east-2.amazonaws.com/massachusettsinstituteoftechnologymit.svg',
  ],
  [
    'Shell International Exploration & Production, Inc.',
    'https://lf-platform-documents-prod.s3.amazonaws.com/shell%20%282%29.svg',
  ],
  [
    'Allianz Group',
    'https://lf-master-organization-logos-prod.s3.us-east-2.amazonaws.com/AllianzGroup.svg',
  ],
  [
    'Tencent Technology (Shenzhen) Co., Ltd.',
    'https://lf-master-organization-logos-prod.s3.us-east-2.amazonaws.com/tencent-holdings-limited.svg',
  ],
  [
    'International Business Machines Corporation',
    'https://lf-master-organization-logos-prod.s3.us-east-2.amazonaws.com/international-business-machines-corporation.svg',
  ],
])

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

  const alreadyProcessedOrgIds = new Set<string>()
  const alreadyProcessedDomains = new Set<string>()

  for (const record of records) {
    const domain = record['ACCOUNT_DOMAIN'].trim()
    let accountName = record['ACCOUNT_NAME'].trim()
    let logo = record['LOGO_URL']

    if (domainToNameMap.has(domain)) {
      accountName = domainToNameMap.get(domain)
    }

    if (nameToLogoMap.has(accountName)) {
      logo = nameToLogoMap.get(accountName)
    }

    await dbConnection.tx(async (conn) => {
      const organizationId = await findOrganizationId(conn, domain)

      if (organizationId) {
        if (alreadyProcessedOrgIds.has(organizationId)) {
          return
        }

        const data: any = {}

        stats.set(Stat.ORG_FOUND, (stats.get(Stat.ORG_FOUND) || 0) + 1)

        const orgData = await getOrganizationData(conn, organizationId)

        // update the name if it is different
        if (orgData.displayName !== accountName) {
          data.displayName = accountName
          stats.set(Stat.ORG_NAME_UPDATED, (stats.get(Stat.ORG_NAME_UPDATED) || 0) + 1)
        }

        // remove identity from db because alternative domain one already exists
        const toDelete: OrgIdentity[] = []
        // move identity to be alternative domain identity
        const toAlternativeDomain: OrgIdentity[] = []
        // update identity to be verified instead
        const toVerify: OrgIdentity[] = []
        // create primary identity verified identity if one does not exists already
        const toInsert: OrgIdentity[] = []

        if (domain) {
          // only use this domain as primary identity and set the others to be alternative
          const existing = orgData.identities.find(
            (i) =>
              i.type === OrganizationIdentityType.PRIMARY_DOMAIN &&
              i.value.trim() === domain.trim(),
          )

          if (!existing) {
            // create primary identity if one does not already exists
            stats.set(
              Stat.ORG_PRIMARY_DOMAIN_NOT_FOUND,
              (stats.get(Stat.ORG_PRIMARY_DOMAIN_NOT_FOUND) || 0) + 1,
            )
            const identity = {
              type: OrganizationIdentityType.PRIMARY_DOMAIN,
              value: domain,
              platform: 'custom',
              verified: true,
            }
            orgData.identities.push(identity)
            toInsert.push(identity)
          } else if (!existing.verified) {
            // just verify the existing primary identity
            stats.set(Stat.ORG_IDENTITY_VERIFIED, (stats.get(Stat.ORG_IDENTITY_VERIFIED) || 0) + 1)
            toVerify.push(existing)
          }

          // we have to take care of the other primary identities so that only one is left
          const otherPrimaryDomainIdentities = orgData.identities.filter(
            (i) =>
              i.type === OrganizationIdentityType.PRIMARY_DOMAIN &&
              i.value.trim() !== domain.trim(),
          )

          for (const identity of otherPrimaryDomainIdentities) {
            // find existing alternative domain identity with the same value
            const alternative = orgData.identities.find(
              (i) =>
                i.type === OrganizationIdentityType.ALTERNATIVE_DOMAIN &&
                i.value.trim() === identity.value.trim(),
            )
            if (alternative) {
              if (!alternative.verified && identity.verified) {
                // an existing unverified alternative identity exists, update it to be verified and remove the primary one
                stats.set(
                  Stat.ORG_IDENTITY_REMOVED,
                  (stats.get(Stat.ORG_PRIMARY_DOMAIN_NOT_FOUND) || 0) + 1,
                )
                stats.set(
                  Stat.ORG_IDENTITY_VERIFIED,
                  (stats.get(Stat.ORG_IDENTITY_VERIFIED) || 0) + 1,
                )
                toDelete.push(identity)
                toVerify.push(alternative)
              } else {
                // an existing verified alternative identity exists, just remove the primary one
                stats.set(
                  Stat.ORG_IDENTITY_REMOVED,
                  (stats.get(Stat.ORG_PRIMARY_DOMAIN_NOT_FOUND) || 0) + 1,
                )
                toDelete.push(identity)
              }
            } else {
              // an alternative identity does not exist, move the primary one to be alternative
              stats.set(
                Stat.ORG_IDENTITY_TO_ALTERNATIVE,
                (stats.get(Stat.ORG_PRIMARY_DOMAIN_NOT_FOUND) || 0) + 1,
              )
              toAlternativeDomain.push(identity)
            }
          }
        }

        // update the logo if it is different
        if (logo && (!orgData.logo || orgData.logo.trim() !== logo.trim())) {
          data.logo = logo
          stats.set(Stat.ORG_LOGO_UPDATED, (stats.get(Stat.ORG_LOGO_UPDATED) || 0) + 1)
        }

        await updateOrganization(conn, organizationId, data)
        await updateIdentities(
          conn,
          organizationId,
          orgData.tenantId,
          toAlternativeDomain,
          toDelete,
          toVerify,
          toInsert,
        )

        alreadyProcessedOrgIds.add(organizationId)
      } else {
        if (alreadyProcessedDomains.has(domain)) {
          return
        }
        alreadyProcessedDomains.add(domain)
        stats.set(Stat.ORG_NOT_FOUND, (stats.get(Stat.ORG_FOUND) || 0) + 1)
      }
    })
  }

  for (const [stat, count] of stats) {
    log.info({ stat, count }, 'Summary')
  }

  process.exit(0)
})

const updateIdentities = async (
  conn: DbTransaction,
  organizationId: string,
  tenantId: string,
  toAlternativeDomain: OrgIdentity[],
  toDelete: OrgIdentity[],
  toVerify: OrgIdentity[],
  toInsert: OrgIdentity[],
) => {
  for (const i of toInsert) {
    await conn.none(
      `
        insert into "organizationIdentities" ("organizationId", "tenantId", type, value, platform, verified)
        values ($(organizationId), $(tenantId), $(type), $(value), $(platform), $(verified))
      `,
      {
        organizationId,
        tenantId,
        type: OrganizationIdentityType.PRIMARY_DOMAIN,
        platform: 'custom',
        verified: true,
        value: i.value,
      },
    )
  }
  for (const i of toDelete) {
    await conn.none(
      `
        delete from "organizationIdentities"
        where "organizationId" = $(organizationId) and type = $(type) and value = $(value)
      `,
      {
        organizationId,
        type: OrganizationIdentityType.PRIMARY_DOMAIN,
        value: i.value,
      },
    )
  }
  for (const i of toAlternativeDomain) {
    await conn.none(
      `
        update "organizationIdentities"
        set type = '${OrganizationIdentityType.ALTERNATIVE_DOMAIN}'
        where "organizationId" = $(organizationId) and type = $(type) and value = $(value)
      `,
      {
        organizationId,
        type: OrganizationIdentityType.PRIMARY_DOMAIN,
        value: i.value,
      },
    )
  }
  for (const i of toVerify) {
    await conn.none(
      `
        update "organizationIdentities"
        set verified = true
        where "organizationId" = $(organizationId) and type = $(type) and value = $(value)
      `,
      {
        organizationId,
        type: i.type,
        value: i.value,
      },
    )
  }
}

const updateOrganization = async (conn: DbTransaction, organizationId: string, data: any) => {
  if (Object.keys(data).length === 0) {
    return
  }

  const params = {
    organizationId,
    ...data,
  }

  const toSet = []
  if (data.displayName) {
    toSet.push(`"displayName" = $(displayName)`)
  }

  if (data.logo) {
    toSet.push(`logo = $(logo)`)
  }

  await conn.none(
    `
      update organizations
      set ${toSet.join(', ')}
      where id = $(organizationId)
    `,
    {
      params,
    },
  )
}

const getOrganizationData = async (
  conn: DbTransaction,
  organizationId: string,
): Promise<OrgData> => {
  const results = await Promise.all([
    conn.one(
      `select id, "tenantId", "displayName", logo from organizations where id = $(organizationId)`,
      {
        organizationId,
      },
    ),
    conn.any(
      `select type, value, platform, verified from "organizationIdentities" where "organizationId" = $(organizationId)`,
      { organizationId },
    ),
  ])

  const [org, identities] = results

  return {
    id: org.id,
    tenantId: org.tenantId,
    logo: org.logo,
    displayName: org.displayName,
    identities,
  }
}

const findOrganizationId = async (
  conn: DbTransaction,
  accountDomain: string,
): Promise<string | null> => {
  const query = `
    select "organizationId"
    from "lfxMemberships"
    where "accountDomain" = $(accountDomain)
    limit 1
  `

  const result = await conn.oneOrNone(query, { accountDomain })

  if (!result) {
    return null
  }

  return result.organizationId
}

enum Stat {
  ORG_FOUND = 'ORG_FOUND',
  ORG_DUPLICATED = 'ORG_DUPLICATED',
  ORG_NOT_FOUND = 'ORG_NOT_FOUND',

  ORG_NAME_UPDATED = 'ORG_NAME_UPDATED',
  ORG_PRIMARY_DOMAIN_NOT_FOUND = 'ORG_PRIMARY_DOMAIN_NOT_FOUND',
  ORG_IDENTITY_TO_ALTERNATIVE = 'ORG_IDENTITY_TO_ALTERNATIVE',
  ORG_IDENTITY_VERIFIED = 'ORG_IDENTITY_VERIFIED',
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
  tenantId: string
  logo: string
  displayName: string
  identities: OrgIdentity[]
}
