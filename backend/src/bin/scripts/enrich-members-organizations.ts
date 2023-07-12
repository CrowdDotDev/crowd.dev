import commandLineArgs from 'command-line-args'
import commandLineUsage from 'command-line-usage'
import * as fs from 'fs'
import path from 'path'
import { getServiceLogger } from '@crowd/logging'
import SequelizeRepository from '../../database/repositories/sequelizeRepository'
import MemberRepository from '../../database/repositories/memberRepository'
import { sendBulkEnrichMessage } from '../../serverless/utils/nodeWorkerSQS'
import { ORGANIZATION_ENRICHMENT_CONFIG } from '../../conf'
import OrganizationEnrichmentService from '../../services/premium/enrichment/organizationEnrichmentService'
import OrganizationRepository from '../../database/repositories/organizationRepository'
import getUserContext from '@/database/utils/getUserContext'

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
    header: 'Enrich members and organizations of the tenant',
    content: 'Enrich all enrichable members and organizations of the tenant',
  },
  {
    header: 'Options',
    optionList: options,
  },
]

const usage = commandLineUsage(sections)
const parameters = commandLineArgs(options)

if (parameters.help || !parameters.tenant || !parameters.plan) {
  console.log(usage)
} else {
  setImmediate(async () => {
    const options = await SequelizeRepository.getDefaultIRepositoryOptions()
    const tenantIds = parameters.tenant.split(',')
    const limit = 1000

    for (const tenantId of tenantIds) {
      try {
        const tenant = await options.database.tenant.findByPk(tenantId)

        if (!tenant) {
          log.error({ tenantId }, 'Tenant not found!')
          process.exit(1)
        } else {
          log.info(
            { tenantId },
            `Tenant found - starting enrichment operation for tenant ${tenantId}`,
          )

          // Members enrichment
          let offset = 0
          let totalMembers = 0

          do {
            const members = await MemberRepository.findAndCountAllv2(
              {
                limit,
                offset,
                countOnly: false,
              },
              options,
            )

            totalMembers = members.count
            log.info({ tenantId }, `Total members found in the tenant: ${totalMembers}`)

            const membersToEnrich = members.rows.map((m) => m.id)
            await sendBulkEnrichMessage(tenant, membersToEnrich)

            log.info(
              { tenantId },
              `Enriched members from ${offset + 1} to ${offset + membersToEnrich.length}`,
            )

            offset += limit
          } while (totalMembers > offset)

          log.info({ tenantId }, `Members enrichment operation finished for tenant ${tenantId}`)

          // Organizations enrichment
          const organizations = await OrganizationRepository.findAndCountAll(
            {
              limit,
              offset: 0,
            },
            options,
          )

          const userContext = await getUserContext(tenantId)
          const totalOrganizations = organizations.count

          const enrichmentService = new OrganizationEnrichmentService({
            options: userContext,
            apiKey: ORGANIZATION_ENRICHMENT_CONFIG.apiKey,
            tenantId,
            limit: totalOrganizations,
          })

          const enrichedOrgs = await enrichmentService.enrichOrganizationsAndSignalDone()

          log.info({ tenantId }, `Total organizations enriched in the tenant: ${enrichedOrgs}`)

          log.info(
            { tenantId },
            `Organizations enrichment operation finished for tenant ${tenantId}`,
          )
        }
      } catch (error) {
        log.error({ tenantId }, `Error occurred during enrichment operation: ${error}`)
      }
    }

    process.exit(0)
  })
}
