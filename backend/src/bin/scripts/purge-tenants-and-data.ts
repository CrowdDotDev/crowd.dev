import commandLineArgs from 'command-line-args'
import commandLineUsage from 'command-line-usage'
import * as fs from 'fs'
import path from 'path'
import { QueryTypes } from 'sequelize'
import { getServiceLogger } from '@crowd/logging'
import { databaseInit } from '@/database/databaseConnection'

/* eslint-disable no-continue */
/* eslint-disable @typescript-eslint/no-loop-func */

const banner = fs.readFileSync(path.join(__dirname, 'banner.txt'), 'utf8')

const options = [
  {
    name: 'tenantIds',
    alias: 't',
    type: String,
    description:
      'Tenants to be excluded from the data purging process. IDs should be comma-separated list.',
  },
  {
    name: 'help',
    alias: 'h',
    type: Boolean,
    description: 'Print this usage guide.',
  },
]
const sections = [
  {
    content: banner,
    raw: true,
  },
  {
    header: 'Purge tenants and their data',
    content: 'Purge tenants and their data whose trial period is over.',
  },
  {
    header: 'Options',
    optionList: options,
  },
]

const usage = commandLineUsage(sections)
const parameters = commandLineArgs(options)

const log = getServiceLogger()

async function purgeTenantsAndData(): Promise<void> {
  // initialize database with 15 minutes query timeout
  const prodDb = await databaseInit(1000 * 60 * 15, true)

  let count = 0
  let purgeableTenants

  log.info('Querying database for tenants where trialEndsAt exists and trial period is over.')

  const doNotPurgeTenantIds = parameters.tenantIds.split(',')

  purgeableTenants = await prodDb.sequelize.query(
    `
      select id
      from tenants
      where "trialEndsAt" is not null and "trialEndsAt" < now()`,
    {
      type: QueryTypes.SELECT,
    },
  )

  purgeableTenants = purgeableTenants.filter((t) => !doNotPurgeTenantIds.includes(t.id))

  log.info(`Found ${purgeableTenants.length} tenants to purge!`)

  const tables = [
    'githubRepos',
    'integrations',
    'incomingWebhooks',
    'memberSegments',
    'organizationSegments',
    'microservices',
    'conversations',
    'activities',
    'reports',
    'settings',
    'widgets',
    'recurringEmailsHistory',
    'eagleEyeContents',
    'members',
    'memberAttributeSettings',
    'tasks',
    'organizationCacheLinks',
    'organizations',
  ]

  for (const tenant of purgeableTenants) {
    const transaction = await prodDb.sequelize.transaction()
    try {
      for (const table of tables) {
        log.info(`Purging data from ${table} table for tenant: ${tenant.id}`)
        // The 'organizationCacheLinks' table has a foreign key constraint on 'organizations' table.
        // So, before deleting any record from 'organizations', we need to delete the corresponding records from 'organizationCacheLinks'.
        if (table === 'organizationCacheLinks') {
          await prodDb.sequelize.query(
            `
              delete from "${table}"
              where "organizationId" IN
                    (select id
                     from organizations
                     where "tenantId" = :tenantId)`,
            {
              replacements: { tenantId: tenant.id },
              type: QueryTypes.DELETE,
              transaction,
            },
          )
        } else {
          await prodDb.sequelize.query(
            `
              delete from "${table}"
              where "tenantId" = :tenantId`,
            {
              replacements: { tenantId: tenant.id },
              type: QueryTypes.DELETE,
              transaction,
            },
          )
        }
      }

      // remove tenant from tenants table
      await prodDb.sequelize.query(
        `
          delete from tenants
          where id = :tenantId`,
        {
          replacements: { tenantId: tenant.id },
          type: QueryTypes.DELETE,
          transaction,
        },
      )

      await transaction.commit()

      count++
      log.info(`Purged ${count}/${purgeableTenants.length} tenants!`)
    } catch (error) {
      await transaction.rollback()
      log.error(`Error purging tenants and their data: ${error.message}`)
      process.exit(1)
    }
  }

  log.info('Revoked access and purged data for free tenants!')
}

if (parameters.help) {
  // eslint-disable-next-line no-console
  console.log(usage)
} else {
  setImmediate(async () => {
    log.info('Starting purging tenants with expired trial period...')
    await purgeTenantsAndData()
    process.exit(0)
  })
}
