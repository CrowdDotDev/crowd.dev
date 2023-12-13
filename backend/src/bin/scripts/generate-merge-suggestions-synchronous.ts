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
import TenantService from '@/services/tenantService'

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
    name: 'plan',
    alias: 'p',
    type: String,
    description:
      'Comma separated plans - works with allTenants flag. Only generate suggestions for tenants with specific plans. Available plans: Growth, Scale, Enterprise',
  },
  {
    name: 'allTenants',
    alias: 'a',
    type: Boolean,
    defaultValue: false,
    description: 'Set this flag to merge similar organizations for all tenants.',
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

if (parameters.help || (!parameters.tenant && !parameters.allTenants)) {
  console.log(usage)
} else {
  setImmediate(async () => {
    let tenantIds

    if (parameters.allTenants) {
      tenantIds = (await TenantService._findAndCountAllForEveryUser({})).rows
      if (parameters.plan) {
        tenantIds = tenantIds.filter((tenant) => parameters.plan.split(',').includes(tenant.plan))
      }
      tenantIds = tenantIds.map((t) => t.id)
    } else if (parameters.tenant) {
      tenantIds = parameters.tenant.split(',')
    } else {
      tenantIds = []
    }

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
    }

    process.exit(0)
  })
}
