import commandLineArgs from 'command-line-args'
import commandLineUsage from 'command-line-usage'
import * as fs from 'fs'
import path from 'path'
import { QueryTypes } from 'sequelize'
import { getServiceLogger } from '@crowd/logging'
import SequelizeRepository from '../../database/repositories/sequelizeRepository'

/* eslint-disable no-continue */
/* eslint-disable @typescript-eslint/no-loop-func */

const banner = fs.readFileSync(path.join(__dirname, 'banner.txt'), 'utf8')

const options = [
  {
    name: 'tenantIds',
    alias: 't',
    type: String,
    description: 'Tenants to be excluded from the data purging process. IDs should be comma-separated list.',
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
  const dbOptions = await SequelizeRepository.getDefaultIRepositoryOptions()

  let count = 0
  let purgeableTenants

  const seq = SequelizeRepository.getSequelize(dbOptions)
  const transaction = await SequelizeRepository.createTransaction(dbOptions)

  log.info('Querying database for tenants where trialEndsAt exists and trial period is over.')

  const doNotPurgeTenantIds = parameters.tenantIds.split(',')

  purgeableTenants = await seq.query(
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
    'memberSegments',
    'organizationSegments',
    'microservices',
    'conversations',
    'activities',
    'githubRepos',
    'integrations',
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

  try {
    for (const tenant of purgeableTenants) {
      for (const table of tables) {
        // The 'organizationCacheLinks' table has a foreign key constraint on 'organizations' table.
        // So, before deleting any record from 'organizations', we need to delete the corresponding records from 'organizationCacheLinks'.
        if (table === 'organizationCacheLinks') {
          await seq.query(
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
          await seq.query(
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
      await seq.query(
        `
        delete from tenants
        where id = :tenantId`,
        {
          replacements: { tenantId: tenant.id },
          type: QueryTypes.DELETE,
          transaction,
        },
      )

      count++
      log.info(`Purged ${count}/${purgeableTenants.length} tenants!`)
    }
    await SequelizeRepository.commitTransaction(transaction)
    log.info('Revoked access and purged data for free tenants!')
  } catch (error) {
    await SequelizeRepository.rollbackTransaction(transaction)
    log.error(`Error purging tenants and their data: ${error.message}`)
    process.exit(1)
  }
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
