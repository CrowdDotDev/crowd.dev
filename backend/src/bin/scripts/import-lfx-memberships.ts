/* eslint-disable @typescript-eslint/dot-notation */

/* eslint-disable no-console */

import * as fs from 'fs'
import path from 'path'

/* eslint-disable import/no-extraneous-dependencies */
import commandLineArgs from 'command-line-args'
import commandLineUsage from 'command-line-usage'
import { parse } from 'csv-parse/sync'
import uniq from 'lodash/uniq'
import moment from 'moment'

import { databaseInit } from '@/database/databaseConnection'
import { IRepositoryOptions } from '@/database/repositories/IRepositoryOptions'
import SequelizeRepository from '@/database/repositories/sequelizeRepository'
import { QueryExecutor } from '@crowd/data-access-layer'
import { LfxMembership, insertLfxMembership } from '@crowd/data-access-layer/src/lfx_memberships'
import {
  findOrgIdByUniqueDisplayName,
  findOrgIdsByVerifiedDomains,
} from '@crowd/data-access-layer/src/organizations'
import { findProjectGroupByName } from '@crowd/data-access-layer/src/segments'

const options = [
  {
    name: 'help',
    alias: 'h',
    type: Boolean,
    description: 'Print this usage guide.',
  },
  {
    name: 'file',
    alias: 'f',
    type: String,
    description: 'Path to CSV file to import',
  },
  {
    name: 'tenantId',
    alias: 't',
    type: String,
    description: 'Tenant Id. Hint: what you probably need is 875c38bd-2b1b-4e91-ad07-0cfbabb4c49f',
  },
]
const sections = [
  {
    header: `Import LFX Membership `,
    content: 'Replaces all LFX memberships with the records from a CSV file.',
  },
  {
    header: 'Options',
    optionList: options,
  },
]

const usage = commandLineUsage(sections)
const parameters = commandLineArgs(options)

const INDIVIDUAL_ACCOUNT_NAMES = [
  'Individual - No Account',
  'Individual ? No  Account',
  'individual with no account',
]

function parseDomains(domains: string) {
  return uniq(
    domains
      .split(',')
      .map((domain) => domain.trim().toLowerCase())
      .filter((domain) => domain.length > 0)

      // the rest if for values that look like this: "andesdigital.cl\n\n--- Merged Data:\n\ andesdigital.cl"
      .flatMap((domain) => domain.split('\n'))
      .filter((domain) => domain.match(/^[a-z0-9.-]+$/)),
  )
}

function getDomains(record): string[] {
  return [...parseDomains(record['Account Domain']), ...record['Domain Alias']]
}

function toAccountDomainKey(name: string, domain: string) {
  return `${name}\n${domain}`
}

async function findOrgId(qx: QueryExecutor, orgIdByAccountDomain: Map<string, string>, record) {
  const name = record['Account Name']
  const domain = getDomains(record).find((d) =>
    orgIdByAccountDomain.has(toAccountDomainKey(name, d)),
  )

  if (domain) {
    return orgIdByAccountDomain.get(toAccountDomainKey(name, domain))
  }

  return findOrgIdByUniqueDisplayName(qx, name)
}

if (parameters.help || !parameters.file || !parameters.tenantId) {
  console.log(usage)
} else {
  setImmediate(async () => {
    const prodDb = await databaseInit()
    const repoOptions = { database: prodDb } as IRepositoryOptions

    const fileData = fs.readFileSync(path.resolve(parameters.file), 'latin1')

    const records = parse(fileData, {
      columns: true,
      skip_empty_lines: true,
    }).filter((record) => !INDIVIDUAL_ACCOUNT_NAMES.includes(record['Account Name']))

    for (const record of records) {
      record['Domain Alias'] = parseDomains(record['Domain Alias'])
    }

    console.log('New records:', records.length)

    await SequelizeRepository.withTx(repoOptions, async (transaction) => {
      const qx = SequelizeRepository.getQueryExecutor({ ...repoOptions, transaction })

      const accounts = records.flatMap((record) =>
        getDomains(record).map((domain) => ({ name: record['Account Name'], domain })),
      )
      const domainOrgs = await findOrgIdsByVerifiedDomains(qx, accounts)
      const orgIdByAccountDomain = new Map(
        domainOrgs.map((row) => [toAccountDomainKey(row.name, row.domain), row.organizationId]),
      )

      await qx.result(`DELETE FROM "lfxMemberships"`)

      console.log('All records deleted')

      for (const [i, record] of records.entries()) {
        const orgName = record['Account Name']

        const segment = await findProjectGroupByName(qx, {
          name: record['Project'],
        })
        const orgId = await findOrgId(qx, orgIdByAccountDomain, record)
        const row = {
          organizationId: orgId,
          segmentId: segment?.id,
          accountName: orgName,
          parentAccount: record['Parent Account'],
          project: record['Project'],
          productName: record['Product Name'],
          purchaseHistoryName: record['Purchase History Name'],
          installDate: moment(record['Install Date'], 'MM/DD/YYYY').toDate(),
          usageEndDate: moment(record['Usage End Date'], 'MM/DD/YYYY').toDate(),
          status: record['Status'],
          priceCurrency: record['Price Currency'],
          price: parseInt(record['Price'], 10),
          productFamily: record['Product Family'],
          tier: record['Tier'],
          accountDomain: record['Account Domain'],
          domainAlias: record['Domain Alias'],
        } as LfxMembership

        await insertLfxMembership(qx, row)

        console.log(
          orgId ? 'Inserted record:' : 'Inserted record without organization:',
          i,
          orgName,
        )
      }
    })

    process.exit(0)
  })
}
