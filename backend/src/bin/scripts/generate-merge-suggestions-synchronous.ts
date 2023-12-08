import commandLineArgs from 'command-line-args'
import commandLineUsage from 'command-line-usage'
import { getOpensearchClient } from '@crowd/opensearch'
import { OrganizationMergeSuggestionType } from '@crowd/types'
import * as fs from 'fs'
import path from 'path'
import { IRepositoryOptions } from '@/database/repositories/IRepositoryOptions'
import getUserContext from '@/database/utils/getUserContext'
import SegmentService from '@/services/segmentService'
import { OPENSEARCH_CONFIG } from '@/conf'
import OrganizationService from '@/services/organizationService'

/* eslint-disable no-console */

const banner = fs.readFileSync(path.join(__dirname, 'banner.txt'), 'utf8')

const options = [
  {
    name: 'tenant',
    alias: 't',
    type: String,
    description:
      'The unique ID of that tenant that you would like to generate merge suggestions for.',
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
    header: 'Generate merge suggestions for a tenant',
    content: 'Generate merge suggestions for a tenant',
  },
  {
    header: 'Options',
    optionList: options,
  },
]

const usage = commandLineUsage(sections)
const parameters = commandLineArgs(options)

if (parameters.help || !parameters.tenant) {
  console.log(usage)
} else {
  setImmediate(async () => {
    const tenantIds = parameters.tenant.split(',')

    for (const tenantId of tenantIds) {
      const userContext: IRepositoryOptions = await getUserContext(tenantId)
      const segmentService = new SegmentService(userContext)
      const { rows: segments } = await segmentService.querySubprojects({})
      userContext.currentSegments = segments
      userContext.opensearch = getOpensearchClient(OPENSEARCH_CONFIG)

      console.log(`Generating organization merge suggestions for tenant ${tenantId}!`)

      const organizationService = new OrganizationService(userContext)
      await organizationService.generateMergeSuggestions(
        OrganizationMergeSuggestionType.BY_IDENTITY,
      )

      console.log(`Done generating organization merge suggestions for tenant ${tenantId}!`)

      process.exit(0)
    }

    process.exit(0)
  })
}
