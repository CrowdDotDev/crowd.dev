import commandLineArgs from 'command-line-args'
import commandLineUsage from 'command-line-usage'
import * as fs from 'fs'
import path from 'path'
import { getServiceLogger } from '@crowd/logging'
import SequelizeRepository from '../../database/repositories/sequelizeRepository'
import MemberRepository from '../../database/repositories/memberRepository'
import { sendBulkEnrichMessage, sendNodeWorkerMessage } from '../../serverless/utils/nodeWorkerSQS'
import OrganizationRepository from '../../database/repositories/organizationRepository'
import { NodeWorkerMessageType } from '../../serverless/types/workerTypes'
import { NodeWorkerMessageBase } from '../../types/mq/nodeWorkerMessageBase'

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
  {
    name: 'organization',
    alias: 'o',
    type: Boolean,
    defaultValue: false,
    description: 'Enrich organizations of the tenant',
  },
  {
    name: 'member',
    alias: 'm',
    type: Boolean,
    defaultValue: false,
    description: 'Enrich members of the tenant',
  },
]
const sections = [
  {
    content: banner,
    raw: true,
  },
  {
    header: 'Enrich members, organizations or both of the tenant',
    content: 'Enrich all enrichable members, organizations or both of the tenant',
  },
  {
    header: 'Options',
    optionList: options,
  },
]

const usage = commandLineUsage(sections)
const parameters = commandLineArgs(options)

if (parameters.help || !parameters.tenant || !parameters.organization || !parameters.member) {
  console.log(usage)
} else {
  setImmediate(async () => {
    const options = await SequelizeRepository.getDefaultIRepositoryOptions()
    const tenantIds = parameters.tenant.split(',')
    const enrichMembers = parameters.member
    const enrichOrganizations = parameters.organization
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
          if (
            (enrichMembers && !enrichOrganizations) ||
            (!enrichMembers && !enrichOrganizations) ||
            (enrichMembers && enrichOrganizations)
          ) {
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
              // notifyFrontend is set to false to prevent sending notifications to the frontend
              await sendBulkEnrichMessage(tenant, membersToEnrich, false)

              log.info(
                { tenantId },
                `Enriched members from ${offset + 1} to ${offset + membersToEnrich.length}`,
              )

              offset += limit
            } while (totalMembers > offset)

            log.info({ tenantId }, `Members enrichment operation finished for tenant ${tenantId}`)
          }

          // Organizations enrichment
          if (
            (enrichOrganizations && !enrichMembers) ||
            (!enrichMembers && !enrichOrganizations) ||
            (enrichMembers && enrichOrganizations)
          ) {
            const organizations = await OrganizationRepository.findAndCountAll(
              {
                limit,
                offset: 0,
              },
              options,
            )

            const totalOrganizations = organizations.count

            for (const organization of organizations.rows) {
              const payload = {
                type: NodeWorkerMessageType.NODE_MICROSERVICE,
                service: 'enrich-organizations',
                tenantId,
                organizationId: organization.id,
              } as NodeWorkerMessageBase

              log.info({ payload }, 'Enricher worker payload for organization')
              await sendNodeWorkerMessage(organization.id, payload)
            }

            log.info(
              { tenantId },
              `Total organizations enriched in the tenant: ${totalOrganizations}`,
            )

            log.info(
              { tenantId },
              `Organizations enrichment operation finished for tenant ${tenantId}`,
            )
          }
        }
      } catch (error) {
        log.error({ tenantId }, `Error occurred during enrichment operation: ${error}`)
      }
    }

    process.exit(0)
  })
}
