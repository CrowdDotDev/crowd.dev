import commandLineArgs from 'command-line-args'
import commandLineUsage from 'command-line-usage'
import * as fs from 'fs'
import path from 'path'
import SequelizeRepository from '../../database/repositories/sequelizeRepository'
import OrganizationEnrichmentService from '@/services/premium/enrichment/organizationEnrichmentService'
import { ORGANIZATION_ENRICHMENT_CONFIG } from '@/conf'

/* eslint-disable no-console */

const banner = fs.readFileSync(path.join(__dirname, 'banner.txt'), 'utf8')

const options = [
  {
    name: 'name',
    alias: 'n',
    type: String,
    description: 'Find organization by given name',
  },
  {
    name: 'website',
    alias: 'w',
    type: String,
    description: 'Find organization by given website',
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
    header: 'Get organization enrichment data from pdl',
    content: 'Get organization enrichment data from pdl',
  },
  {
    header: 'Options',
    optionList: options,
  },
]

const usage = commandLineUsage(sections)
const parameters = commandLineArgs(options)

if (parameters.help || (!parameters.name && !parameters.website)) {
  console.log(usage)
} else {
  setImmediate(async () => {
    const opts = await SequelizeRepository.getDefaultIRepositoryOptions()

    const srv = new OrganizationEnrichmentService({
      options: opts,
      apiKey: ORGANIZATION_ENRICHMENT_CONFIG.apiKey,
      tenantId: null,
      limit: null,
    })

    const data = await srv.getEnrichment({ website: parameters.website, name: parameters.name })

    console.log(data)

    process.exit(0)
  })
}
