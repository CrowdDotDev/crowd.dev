import commandLineArgs from 'command-line-args'
import commandLineUsage from 'command-line-usage'
import * as fs from 'fs'
import path from 'path'
import { getServiceLogger } from '@crowd/logging'
import { BulkorganizationEnrichmentWorker } from '@/serverless/microservices/nodejs/bulk-enrichment/bulkOrganizationEnrichmentWorker'

/* eslint-disable no-console */

const banner = fs.readFileSync(path.join(__dirname, 'banner.txt'), 'utf8')

const log = getServiceLogger()

const options = [
  {
    name: 'tenant',
    alias: 't',
    type: String,
    description: 'The unique ID of tenant that you would like to enrich.',
  },
  {
    name: 'limit',
    alias: 'l',
    type: Number,
    description: 'The maximum number of organizations to enrich.',
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
    header: 'Enrich organizations of the tenant synchronously',
    content: 'Enrich all enrichable organizations of the tenant',
  },
  {
    header: 'Options',
    optionList: options,
  },
]

const usage = commandLineUsage(sections)
const parameters = commandLineArgs(options)

if (parameters.help || !parameters.tenant || !parameters.limit) {
  console.log(usage)
} else {
  setImmediate(async () => {
    const tenantIds = parameters.tenant.split(',')
    const limit = parameters.limit

    for (const tenantId of tenantIds) {
      await BulkorganizationEnrichmentWorker(tenantId, limit, true)
      log.info(`Done for tenant ${tenantId}`)
    }

    process.exit(0)
  })
}
